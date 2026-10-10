/**
 * dsh-search-mcp — replace dsh's built-in web search with search MCP servers.
 *
 * Registers a `ctx.web` search provider under id `search-mcp`, then **live-pins**
 * the underlying WebRuntime's `searchProviderId` so `web_search` stops using
 * `deepseek-official`.
 *
 * Why not cordis.patch.yml?
 * Pinning `web.searchProvider: search-mcp` (or disabling deepseek) in the
 * bundle patch deadlocks Desktop 0.2 boot: `web` waits for `search-mcp` while
 * this plugin `inject: ['web']`. Live-pin after `registerSearchProvider` avoids
 * that cycle. Do not persist the pin into settings.yaml either — a restart
 * would reintroduce the same deadlock.
 *
 * Why unwrap cordis.original?
 * `ctx.web` is a traceable Proxy. Assigning `ctx.web.searchProviderId = …`
 * does not update the field `search()` reads; pin the unwrapped instance.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import z from '@deepseek-ai/schemastery';
import { credentialRef } from '@deepseek-ai/dsh-credentials';
import { launchEnvironmentOf } from '@deepseek-ai/dsh-launch-environment';
import { SEARCH_MCP_PROVIDER_ID, SearchMCPProvider } from './provider.js';

/** Cordis plugin name used by loader diagnostics. */
export const name = 'search-mcp';

/** Module-load breadcrumb — proves Desktop resolved this build (even if apply never runs). */
try {
  const pkgVersion = JSON.parse(
    readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf8'),
  ).version;
  writeFileSync(
    join(process.env.USERPROFILE || process.env.HOME || '', '.dsh', 'search-mcp-loaded.json'),
    `${JSON.stringify({ t: new Date().toISOString(), version: pkgVersion, name }, null, 2)}\n`,
  );
} catch {
  /* ignore */
}

/** The web seam this provider registers into. */
export const inject = ['web'];

/** Unwrap cordis service proxy → concrete Service instance. */
const CORDIS_ORIGINAL = Symbol.for('cordis.original');

/**
 * Config schema — no `.volatile()` anywhere.
 *
 * Desktop 0.2 cordis rejects nested volatiles (`servers` + `servers.*.id`) with
 * ValidationError and leaves the fiber inactive. The settings UI is a custom
 * `settings.section` (client.browser.js), so Config does not need volatile
 * projection for the form to appear.
 */
const serverSchema = z.object({
  id: z.string(),
  kind: z.string().default('custom'),
  transport: z.string().default('http'),
  url: z.string().default(''),
  command: z.string().default(''),
  args: z.array(z.string()).default([]),
  apiKey: z.string().role('secret'),
  apiKeyEnv: z.string().role('credential-ref').default(''),
  authStyle: z.string().default(''),
  authParam: z.string().default(''),
  authPrefix: z.string().default(''),
  toolName: z.string().default(''),
  // Note: this schemastery fork has no `.optional()`; object fields are
  // optional unless `.required()` is applied, so absence is already allowed.
  maxResults: z.number().step(1).min(1).max(50),
});

const DEFAULT_BAILIAN_SERVER = {
  id: 'bailian',
  kind: 'bailian',
  apiKeyEnv: 'DASHSCOPE_API_KEY',
};

export const Config = z.object({
  defaultServer: z.string().default('bailian'),
  maxResults: z.number().step(1).min(1).max(50).default(8),
  searchTimeoutMs: z.number().step(1).min(1000).default(30000),
  servers: z.array(serverSchema).default([DEFAULT_BAILIAN_SERVER]),
});

/** Settings namespace owning this plugin's section (Settings → Plugins card). */
export const SEARCH_MCP_SETTINGS_NAMESPACE = 'search-mcp';

/** Concrete WebRuntime behind `ctx.web` (cordis traceable proxy). */
function unwrapWeb(web) {
  if (!web || typeof web !== 'object') return null;
  const raw = web[CORDIS_ORIGINAL];
  return raw && typeof raw === 'object' ? raw : web;
}

/** Match WebRuntime.capSources so direct dispatch keeps the same contract. */
function capSources(result, maxResults) {
  if (maxResults === undefined || !Array.isArray(result?.sources) || result.sources.length <= maxResults) {
    return result;
  }
  return { ...result, sources: result.sources.slice(0, maxResults), truncated: true };
}

/**
 * Hot-takeover for the life of this fiber:
 * - pin + wrap on apply (enable / boot)
 * - restore previous provider + unwrap on dispose (disable)
 *
 * No Desktop restart needed for enable/disable — only for loading a new
 * package build into an already-running process.
 */
function takeOverWebSearch(ctx, provider) {
  const web = unwrapWeb(ctx.web);
  if (!web || typeof web.search !== 'function' || !provider) return false;

  const previousId = web.searchProviderId;
  // Leftover pin from a crashed unload → fall back to Desktop default.
  const restoreId =
    previousId === SEARCH_MCP_PROVIDER_ID || previousId === undefined
      ? 'deepseek-official'
      : previousId;

  const previousSearch = web.search.__searchMcpWrapped ? web.search.__searchMcpOriginal : web.search;

  try {
    web.searchProviderId = SEARCH_MCP_PROVIDER_ID;
  } catch (error) {
    ctx.logger?.warn?.('search-mcp: failed to assign web.searchProviderId: %s', error);
    return false;
  }

  async function searchMcpPinned(request, signal) {
    web.searchProviderId = SEARCH_MCP_PROVIDER_ID;
    if (typeof provider.available === 'function' && provider.available()) {
      const result = await provider.search(request, signal);
      return capSources(result, request?.maxResults);
    }
    return previousSearch.call(web, request, signal);
  }
  searchMcpPinned.__searchMcpWrapped = true;
  searchMcpPinned.__searchMcpOriginal = previousSearch;
  web.search = searchMcpPinned;

  // Fiber unload (plugin disable) → hand search back to the built-in path.
  ctx.effect(() => () => {
    if (web.search === searchMcpPinned) {
      web.search = previousSearch;
    }
    if (web.searchProviderId === SEARCH_MCP_PROVIDER_ID) {
      web.searchProviderId = restoreId;
    }
    ctx.logger?.info?.(
      'search-mcp: released web search (restored searchProviderId → %s)',
      restoreId === undefined ? '(unset)' : restoreId,
    );
  });

  ctx.logger?.info?.(
    'search-mcp: took over web.search (%s → %s); disable plugin to release',
    previousId === undefined ? '(unset)' : previousId,
    SEARCH_MCP_PROVIDER_ID,
  );
  return true;
}

/** Best-effort runtime breadcrumb for Desktop diagnosis (~/.dsh/search-mcp-runtime.json). */
async function writeRuntimeBreadcrumb(payload) {
  try {
    const { writeFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const home = process.env.USERPROFILE || process.env.HOME || '';
    if (!home) return;
    writeFileSync(
      join(home, '.dsh', 'search-mcp-runtime.json'),
      `${JSON.stringify({ t: new Date().toISOString(), ...payload }, null, 2)}\n`,
    );
  } catch {
    /* ignore */
  }
}

/** Register the search provider and take over web_search selection. */
export function apply(ctx, config) {
  const current = () => config;
  // Desktop 0.2: avoid soft-inject(['settings']) during bring-up.
  // Loader already projects Config from the cordis entry / patch insert.
  const provider = new SearchMCPProvider(() => resolveOptions(ctx, current()));
  ctx.web.registerSearchProvider(provider);
  // Hot path: enable = take over now; disable = effect disposer restores.
  const tookOver = takeOverWebSearch(ctx, provider);
  if (!tookOver) {
    ctx.logger?.warn?.(
      'search-mcp: could not take over search provider; web_search may still use deepseek-official',
    );
  }
  void writeRuntimeBreadcrumb({
    event: 'apply',
    tookOver,
    searchProviderId: unwrapWeb(ctx.web)?.searchProviderId,
    servers: (config.servers ?? []).map((s) => ({ id: s.id, kind: s.kind })),
  });
}

/**
 * Project the authoritative config into per-search options. The section
 * returned by `setSource` (settings.yaml `search-mcp:` block) replaces the
 * row config entirely, matching how every other settings section behaves.
 *
 * @param ctx - plugin context supplying the credential and environment planes.
 * @param config - the currently authoritative section.
 * @returns options for one search.
 */
function resolveOptions(ctx, config) {
  return {
    servers: config.servers ?? [],
    defaultServer: config.defaultServer ?? '',
    maxResults: config.maxResults ?? 8,
    searchTimeoutMs: config.searchTimeoutMs ?? 30000,
    resolveKey: async (server) => {
      if (server.apiKey !== undefined && server.apiKey.length > 0) return server.apiKey;
      const envName = server.apiKeyEnv ?? '';
      if (envName.length === 0) return undefined;
      const credentials = ctx.get('credentials');
      if (credentials !== undefined) {
        try {
          const resolved = await credentials.resolve(credentialRef(envName));
          if (resolved !== undefined && resolved.value !== undefined && resolved.value.length > 0) {
            return resolved.value;
          }
        } catch {
          /* fall through to the launch environment */
        }
      }
      const ambient = launchEnvironmentOf(ctx).get(envName);
      return ambient !== undefined && ambient.value.length > 0 ? ambient.value : undefined;
    },
  };
}
