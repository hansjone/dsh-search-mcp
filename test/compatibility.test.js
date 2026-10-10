import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (path) => readFile(resolve(root, path), 'utf8')

test('package exports resolve and peerDependencies stay open', async () => {
  const pkg = JSON.parse(await read('package.json'))
  assert.equal(pkg.exports['.'], './lib/index.js')
  assert.equal(pkg.exports['./client'], './lib/client.browser.js')
  assert.equal(pkg.engines.node, '>=20')
  assert.equal(pkg.version, '0.2.42')
  assert.equal(pkg.dsh.client.immediately, false)
  assert.equal(pkg.dependencies['@modelcontextprotocol/client'], '2.0.0')
  assert.ok(!Object.hasOwn(pkg.dependencies, '@modelcontextprotocol/sdk'))

  for (const name of [
    '@deepseek-ai/dsh-api-remotes',
    '@deepseek-ai/dsh-credentials',
    '@deepseek-ai/dsh-http-proxy',
    '@deepseek-ai/dsh-launch-environment',
    '@deepseek-ai/dsh-settings',
    '@deepseek-ai/dsh-web',
    '@deepseek-ai/schemastery',
    '@modelcontextprotocol/client',
    'ipaddr.js',
    'undici',
  ]) {
    assert.equal(pkg.peerDependencies[name], '*')
  }
})

test('browser half registers Settings sidebar + deferred form attach', async () => {
  const client = await read('lib/client.browser.js')
  assert.match(client, /name: "settings\.section"/)
  assert.match(client, /LOCALE_NS = "settings\.search-mcp"/)
  assert.match(client, /const NS = "search-mcp"/)
  // Section id must stay distinct from host Config ns `search-mcp`.
  assert.match(client, /id: "dsh-search-mcp"/)
  assert.match(client, /locale: LOCALE_NS/)
  assert.match(client, /SearchMcpSection/)
  assert.match(client, /createDeferredScope/)
  assert.match(client, /createMemoryScope/)
  assert.doesNotMatch(client, /inject\(\["configForms"\]/)
  assert.match(client, /configForms poll/)
  assert.match(client, /remote\.credentials/)
  assert.doesNotMatch(client, /ctx\.inject\(\["remote"\]/)
  assert.doesNotMatch(client, /name:\s*["']settings\.plugin\.item["']/)
  assert.doesNotMatch(client, /inject\(\["settingsScope"\]/)
  const applyBody = client.slice(client.indexOf('function apply(ctx)'), client.indexOf('exports.apply'))
  assert.doesNotMatch(applyBody, /ctx\.get\?\.\(["']remote["']\)|ctx\.get\(["']remote["']\)/)
  assert.match(client, /const createSnapshotStore = createSnapshotStoreFallback/)
  assert.match(client, /CREDENTIAL_DESCRIBE_BATCH_SIZE = 64/)
  assert.match(client, /legacyKeyBlocked/)
})

test('host registers search provider and hot-takeover without settings mutate', async () => {
  const host = await read('lib/index.js')
  assert.match(host, /registerSearchProvider/)
  assert.match(host, /function takeOverWebSearch/)
  assert.match(host, /Symbol\.for\(['"]cordis\.original['"]\)/)
  assert.match(host, /function unwrapWeb/)
  assert.match(host, /provider\.search\(request, signal\)/)
  assert.match(host, /web\.searchProviderId\s*=\s*SEARCH_MCP_PROVIDER_ID/)
  assert.match(host, /released web search/)
  assert.match(host, /takeOverWebSearch\(ctx, provider\)/)
  assert.match(host, /ctx\.effect\(\(\) => \(\) => \{/)
  // Desktop 0.2: Config must not call .volatile() (array inner is always blocked).
  assert.doesNotMatch(host, /[.\w]\.volatile\s*\(/)
  assert.doesNotMatch(host, /function vol\(/)
  const applyBody = host.slice(host.indexOf('export function apply'), host.indexOf('function resolveOptions'))
  assert.doesNotMatch(applyBody, /ctx\.inject\(\s*\[['"]settings['"]\]/)
  assert.doesNotMatch(applyBody, /setInterval\(/)
  assert.doesNotMatch(applyBody, /settings\.mutate/)
})

test('known providers are CDKey-only while custom keeps advanced fields', async () => {
  const client = await read('lib/client.browser.js')
  const catalog = client.slice(client.indexOf('const CATALOG = {'), client.indexOf('const KIND_OPTIONS'))
  assert.doesNotMatch(catalog, /https?:\/\//)
  assert.doesNotMatch(catalog, /toolName|authParam|transport/)
  assert.match(client, /const known = row\.kind !== "custom"/)
  assert.match(client, /已知提供商不需要填写端点链接/)
})

test('HTTP transport inherits DSH proxy with env fallback and pins DNS on direct path', async () => {
  const transport = await read('lib/client.js')
  const proxyEnv = await read('lib/proxy-env.js')
  assert.match(transport, /from '@modelcontextprotocol\/client'/)
  assert.match(transport, /from '@modelcontextprotocol\/client\/stdio'/)
  assert.doesNotMatch(transport, /from ['"]@modelcontextprotocol\/sdk/)
  assert.match(transport, /resolveEgressRoute/)
  assert.match(proxyEnv, /proxyRouteFor/)
  assert.match(proxyEnv, /readProxyEnv/)
  assert.match(proxyEnv, /getGlobalDispatcher/)
  assert.match(transport, /parseHttpEndpoint/)
  assert.match(transport, /validateHttpEndpoint\(server\.url, \{ signal \}\)/)
  assert.match(transport, /redirect: 'error'/)
  // Bailian rejects the MCP 2026 era probe (HTTP 500); keep Client options
  // at legacy default (capabilities only — no negotiation field).
  assert.match(transport, /\{\s*capabilities:\s*\{\s*\}\s*\}/)
  assert.doesNotMatch(transport, /mode:\s*['"]auto['"]/)
})

test('bundle inserts search-mcp without pinning web.searchProvider (Desktop 0.2 boot-safe)', async () => {
  const patch = await read('cordis.patch.yml')
  assert.doesNotMatch(patch, /^\s*searchProvider:\s*search-mcp\s*$/m)
  assert.doesNotMatch(patch, /- id: web-search-deepseek\s+disabled: true/)
  assert.match(patch, /id: search-mcp/)
  assert.match(patch, /kind: bailian/)
  assert.match(patch, /apiKeyEnv: DASHSCOPE_API_KEY/)
  assert.match(patch, /- id: tool-web\s+disabled: false/)
})
