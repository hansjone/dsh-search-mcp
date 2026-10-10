/**
 * Proxy resolution for search-mcp HTTP egress.
 *
 * Primary: DSH's installed policy (`proxyRouteFor`) when the module resolves.
 * Fallback: process env + undici global dispatcher — covers link: installs where
 * `@deepseek-ai/dsh-http-proxy` is not reachable from the plugin source tree
 * even though DSH boot already installed proxy from the same env vars.
 */

/** First non-empty proxy URL from standard env names. */
export function readProxyEnv() {
  for (const name of [
    'HTTPS_PROXY', 'https_proxy',
    'HTTP_PROXY', 'http_proxy',
    'ALL_PROXY', 'all_proxy',
  ]) {
    const value = process.env[name];
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }
  return undefined;
}

/** Effective NO_PROXY list (may include CIDR entries we do not interpret). */
export function readNoProxyEnv() {
  return (process.env.NO_PROXY ?? process.env.no_proxy ?? '').trim();
}

/**
 * Suffix / host bypass — same rules as dsh-http-proxy (no CIDR matching).
 * @param {URL} url
 * @returns {boolean}
 */
export function bypassesEnvNoProxy(url) {
  const noProxy = readNoProxyEnv();
  if (noProxy.length === 0) return false;
  const host = url.hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '').toLowerCase();
  const port = url.port !== '' ? url.port : url.protocol === 'https:' ? '443' : '80';
  for (const raw of noProxy.split(/[,\s]+/)) {
    const entry = raw.trim().toLowerCase();
    if (entry.length === 0) continue;
    if (entry === '*') return true;
    const colon = entry.lastIndexOf(':');
    let candidate = entry;
    let entryPort;
    if (colon > 0 && /^\d+$/.test(entry.slice(colon + 1))) {
      entryPort = entry.slice(colon + 1);
      candidate = entry.slice(0, colon);
    }
    if (entryPort !== undefined && entryPort !== port) continue;
    candidate = candidate.replace(/^\*?\./, '').replace(/\.$/, '');
    if (candidate.length === 0) continue;
    if (host === candidate || host.endsWith(`.${candidate}`)) return true;
  }
  return false;
}

/**
 * Whether this URL should use a proxy based on ambient env (fallback path).
 * @param {URL} url
 * @param {(host: string) => boolean} isNonPublicIpLiteral
 */
export function shouldUseProcessProxy(url, isNonPublicIpLiteral) {
  if (isNonPublicIpLiteral(url.hostname)) return false;
  if (readProxyEnv() === undefined) return false;
  return !bypassesEnvNoProxy(url);
}

/**
 * Resolve egress: DSH policy module first, then env/global dispatcher fallback.
 * @param {URL} url
 * @param {(host: string) => boolean} isNonPublicIpLiteral
 * @returns {Promise<{ proxied: boolean, dispatcher?: import('undici').Dispatcher, close?: () => Promise<void> | void }>}
 */
export async function resolveEgressRoute(url, isNonPublicIpLiteral) {
  if (isNonPublicIpLiteral(url.hostname)) {
    return { proxied: false };
  }

  try {
    const mod = await import('@deepseek-ai/dsh-http-proxy');
    if (typeof mod.proxyRouteFor === 'function') {
      const route = mod.proxyRouteFor(url);
      if (route.proxied && route.dispatcher) {
        return { proxied: true, dispatcher: route.dispatcher, close: async () => {} };
      }
    }
  } catch {
    // link: source trees often cannot resolve this peer from D:\code\gpt\...
  }

  if (!shouldUseProcessProxy(url, isNonPublicIpLiteral)) {
    return { proxied: false };
  }

  const { ProxyAgent, getGlobalDispatcher } = await import('undici');
  // Prefer the dispatcher DSH installed at boot from the same env vars.
  try {
    const global = getGlobalDispatcher();
    if (global) {
      return { proxied: true, dispatcher: global, close: async () => {} };
    }
  } catch { /* undici unavailable */ }

  const proxyUrl = readProxyEnv();
  if (proxyUrl === undefined) return { proxied: false };
  const agent = new ProxyAgent(proxyUrl);
  return { proxied: true, dispatcher: agent, close: () => agent.close() };
}
