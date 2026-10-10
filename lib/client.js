/**
 * MCP transport layer for one search.
 *
 * Desktop 0.2 ships the split MCP client package (v2). Import that package so
 * link:/Desktop profiles can resolve it from the host graph without a local
 * `node_modules` copy of the legacy monolith SDK.
 *
 * HTTP egress follows web-fetch-http:
 * - When DSH installed a process proxy policy (`proxyRouteFor` → proxied),
 *   reuse that dispatcher so HTTPS_PROXY / system proxy is inherited.
 * - Otherwise keep the DNS-pinned undici Agent (SSRF-safe direct dial).
 */
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { WebError } from '@deepseek-ai/dsh-web';
import { Agent, fetch as undiciFetch } from 'undici';
import { clampSearchResults } from './catalog.js';
import {
  isNonPublicIpLiteral,
  parseHttpEndpoint,
  validateHttpEndpoint,
} from './url-policy.js';

/** Run one search through a resolved server entry. */
export async function callMcpSearch(server, key, args, signal) {
  if (!server.toolName) {
    throw new WebError(
      `search-mcp server "${server.id}": no MCP tool name (set "toolName" or pick a known kind)`,
      'WEB_PROVIDER_ERROR',
    );
  }

  let runtime;
  const client = new Client(
    { name: 'dsh-search-mcp', version: '0.2.40' },
    { capabilities: {}, versionNegotiation: { mode: 'auto' } },
  );
  try {
    runtime = server.transport === 'stdio'
      ? { transport: stdioTransport(server, key), close: async () => {} }
      : await httpRuntime(server, key, signal);
    await race(client.connect(runtime.transport), signal, `connect to "${server.id}"`);
    const callArgs = { query: args.query };
    if (server.countArg.length > 0 && args.maxResults !== undefined) {
      callArgs[server.countArg] = clampSearchResults(server, args.maxResults);
    }
    const result = await race(
      client.callTool({ name: server.toolName, arguments: callArgs }),
      signal,
      `call "${server.id}" tool "${server.toolName}"`,
    );
    if (result.isError) {
      throw new WebError(
        `search-mcp: MCP server "${server.id}" tool "${server.toolName}" reported an error`,
        'WEB_PROVIDER_ERROR',
      );
    }
    return result;
  } catch (error) {
    if (error instanceof WebError) throw error;
    if (signal?.aborted) throw aborted(`complete request for "${server.id}"`);
    const detail = error?.name === 'SearchMcpUrlPolicyError' ? `: ${error.message}` : '';
    throw new WebError(
      `search-mcp server "${server.id}" request failed${detail}`,
      'WEB_PROVIDER_ERROR',
    );
  } finally {
    try {
      await client.close();
    } catch {
      // The connection is already gone.
    }
    try {
      await runtime?.close();
    } catch {
      // The dedicated dispatcher has no shared state to recover.
    }
  }
}

/**
 * Ask DSH's process-wide proxy policy how to send this URL.
 * Soft-import so missing peer does not kill plugin boot.
 */
async function resolveProxyRoute(url) {
  try {
    const mod = await import('@deepseek-ai/dsh-http-proxy');
    if (typeof mod.proxyRouteFor !== 'function') return { proxied: false };
    return mod.proxyRouteFor(url);
  } catch {
    return { proxied: false };
  }
}

/** Build streamable-http transport: inherit proxy when installed, else DNS-pin. */
async function httpRuntime(server, key, signal) {
  const parsed = parseHttpEndpoint(server.url);
  const url = new URL(parsed.url);
  const headers = {};
  if (key !== undefined && key.length > 0 && server.authParam.length > 0) {
    const value = `${server.authPrefix ?? ''}${key}`;
    if (server.authStyle === 'query') url.searchParams.set(server.authParam, value);
    else if (server.authStyle === 'header') headers[server.authParam] = value;
  }

  // Proxied hops must not pin local DNS — that would dial the origin directly
  // and bypass the proxy (same rule as web-fetch-http).
  const route = await resolveProxyRoute(url);
  if (route.proxied && !isNonPublicIpLiteral(url.hostname)) {
    return buildTransport(url, headers, signal, route.dispatcher, async () => {});
  }

  const validated = await validateHttpEndpoint(server.url, { signal });
  const agent = new Agent({
    connect: { lookup: validated.lookup },
    connections: validated.addresses.length,
    maxRedirections: 0,
  });
  return buildTransport(url, headers, signal, agent, () => agent.close());
}

function buildTransport(url, headers, signal, dispatcher, close) {
  const expectedOrigin = url.origin;
  const secureFetch = async (input, init = {}) => {
    const requestUrl = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
    if (requestUrl.origin !== expectedOrigin) {
      throw new Error('search-mcp URL policy: request origin changed after validation');
    }
    return undiciFetch(input, {
      ...init,
      dispatcher,
      redirect: 'error',
      ...(signal !== undefined ? { signal: combineSignals(signal, init.signal) } : {}),
    });
  };

  return {
    transport: new StreamableHTTPClientTransport(url, {
      fetch: secureFetch,
      requestInit: {
        headers,
        redirect: 'error',
        ...(signal !== undefined ? { signal } : {}),
      },
    }),
    close,
  };
}

/** Build a stdio transport; the authParam name doubles as the env var name. */
function stdioTransport(server, key) {
  const env = { ...process.env };
  if (key !== undefined && key.length > 0 && server.authParam.length > 0) {
    env[server.authParam] = `${server.authPrefix ?? ''}${key}`;
  }
  return new StdioClientTransport({
    command: server.command,
    args: server.args ?? [],
    env,
  });
}

/** Race a protocol operation against the caller/timeout abort signal. */
function race(promise, signal, stage) {
  if (signal === undefined) return promise;
  if (signal.aborted) throw aborted(stage);
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      signal.removeEventListener('abort', onAbort);
      reject(aborted(stage));
    };
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener('abort', onAbort);
        reject(error);
      },
    );
  });
}

function combineSignals(base, request) {
  if (request === undefined || request === null || request === base) return base;
  return AbortSignal.any([base, request]);
}

function aborted(stage) {
  return new WebError(`search-mcp: aborted while trying to ${stage}`, 'WEB_ABORTED');
}
