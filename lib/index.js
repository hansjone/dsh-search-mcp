/**
 * dsh-search-mcp — replace dsh's built-in web search with search MCP servers.
 *
 * Adapted for DeepSeek Harness 0.1.2+: settings use
 * `ctx.settings.installSection` (the old free-function
 * `installSettingsSection` from 0.1.1-rc.2 no longer exists).
 *
 * A Cordis plugin that
 *   - registers a `ctx.web` search provider under the id `search-mcp`, and
 *   - installs a Settings section (`search-mcp`) where the user manages the
 *     search MCP server list (kind, endpoint/command, API key or key env
 *     reference, tool name) plus `defaultServer` / `maxResults` /
 *     `searchTimeoutMs` from the web Settings → Plugins page.
 *
 * The package's `cordis.patch.yml` (bundle layer) switches
 * `web.searchProvider` to `search-mcp` and disables the built-in
 * `web-search-deepseek` provider, so while this plugin is enabled the
 * built-in search is unavailable and every `web_search` call runs through
 * the configured MCP server(s). Removing the package restores the built-in.
 */
import z from '@deepseek-ai/schemastery';
import { credentialRef } from '@deepseek-ai/dsh-credentials';
import { launchEnvironmentOf } from '@deepseek-ai/dsh-launch-environment';
import { SearchMCPProvider } from './provider.js';

/** Cordis plugin name used by loader diagnostics. */
export const name = 'search-mcp';

/** The web seam this provider registers into. */
export const inject = ['web'];

/**
 * DSH ≥0.1.7 / 0.2.0 only projects Config fields marked `.volatile()` into the
 * settings UI. Zero volatile fields → the whole entry is silently filtered.
 * Older schemastery without `volatile` keeps the bare schema (≤0.1.5 path).
 */
function vol(schema) {
  return typeof schema?.volatile === 'function' ? schema.volatile() : schema;
}

const serverSchema = z.object({
  id: vol(z.string()),
  kind: vol(z.string().default('custom')),
  transport: vol(z.string().default('http')),
  url: vol(z.string().default('')),
  command: vol(z.string().default('')),
  args: vol(z.array(z.string()).default([])),
  apiKey: vol(z.string().role('secret')),
  apiKeyEnv: vol(z.string().role('credential-ref').default('')),
  authStyle: vol(z.string().default('')),
  authParam: vol(z.string().default('')),
  authPrefix: vol(z.string().default('')),
  toolName: vol(z.string().default('')),
  // Note: this schemastery fork has no `.optional()`; object fields are
  // optional unless `.required()` is applied, so absence is already allowed.
  maxResults: vol(z.number().step(1).min(1).max(50)),
});

export const Config = z.object({
  defaultServer: vol(z.string().default('')),
  maxResults: vol(z.number().step(1).min(1).max(50).default(8)),
  searchTimeoutMs: vol(z.number().step(1).min(1000).default(30000)),
  servers: vol(z.array(serverSchema).default([])),
});

/** Settings namespace owning this plugin's section (Settings → Plugins card). */
export const SEARCH_MCP_SETTINGS_NAMESPACE = 'search-mcp';

/** Normalize settings.describe() across DSH generations. */
function describeRows(describe) {
  if (typeof describe !== 'function') return [];
  try {
    const raw = describe();
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object' && Array.isArray(raw.namespaces)) return raw.namespaces;
  } catch {
    // describe can throw while the provider is settling
  }
  return [];
}

/** Register the search provider and the live settings section. */
export function apply(ctx, config) {
  let current = () => config;
  // Optional settings seam: fall back to the composition entry when settings
  // is absent (same pattern as @deepseek-ai/dsh-web-search-deepseek).
  ctx.inject(['settings'], (settingsCtx) => {
    const settings = settingsCtx.settings;
    const hooks = {
      setSource: (source) => {
        current = source;
      },
      onChange: () => {},
    };
    if (typeof settings?.installSection === 'function') {
      try {
        settings.installSection(ctx, SEARCH_MCP_SETTINGS_NAMESPACE, Config, config, hooks);
        return;
      } catch (error) {
        settingsCtx.logger?.warn?.(
          'dsh-search-mcp: installSection failed (will try register/describe): %s',
          error instanceof Error ? error.message : error,
        );
      }
    }
    // ≤0.1.5 / some Desktop builds: explicit namespace registration.
    // ≥0.1.7: Config is projected from the Loader entry — register may be
    // absent or refuse; follow describe().
    if (typeof settings?.register === 'function') {
      try {
        settings.register(SEARCH_MCP_SETTINGS_NAMESPACE, Config, { base: config, applies: 'live' });
        settingsCtx.logger?.info?.(
          'dsh-search-mcp: settings namespace "%s" registered',
          SEARCH_MCP_SETTINGS_NAMESPACE,
        );
      } catch (error) {
        settingsCtx.logger?.warn?.(
          'dsh-search-mcp: settings.register failed (will follow describe): %s',
          error instanceof Error ? error.message : error,
        );
      }
    }
    // DSH ≥0.1.7 / 0.2.0 — Config projection via describe() (no installSection).
    const readLive = () => {
      const row = describeRows(settings?.describe).find((item) => item.ns === SEARCH_MCP_SETTINGS_NAMESPACE);
      if (row?.value !== null && typeof row?.value === 'object' && !Array.isArray(row.value)) {
        return { ...config, ...row.value };
      }
      return config;
    };
    hooks.setSource(readLive);
    let last = JSON.stringify(readLive());
    const timer = setInterval(() => {
      const next = readLive();
      const fingerprint = JSON.stringify(next);
      if (fingerprint === last) return;
      last = fingerprint;
      hooks.onChange();
    }, 2_000);
    settingsCtx.effect(() => () => clearInterval(timer), 'dsh-search-mcp: settings describe poll');
    settingsCtx.logger?.info?.(
      'dsh-search-mcp: following settings via describe() (DSH ≥0.1.7 / 0.2 path)',
    );
  });
  // `registerSearchProvider` owns its cleanup via ctx.effect (HMR/dispose safe).
  ctx.web.registerSearchProvider(new SearchMCPProvider(() => resolveOptions(ctx, current())));
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
