/**
 * Reproduce Desktop Config validation for search-mcp.
 * Usage: node scripts/_validate-config.mjs
 */
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const nm = join(process.env.USERPROFILE || '', '.dsh', 'profiles', 'node_modules')
const req = createRequire(join(nm, 'package.json'))
const cordisUrl = pathToFileURL(req.resolve('@deepseek-ai/cordis')).href
const { Context, Service } = await import(cordisUrl)
const mod = await import(pathToFileURL(join(pkgRoot, 'lib', 'index.js')).href)

class WebRuntime extends Service {
  searchProviders = new Map()
  searchProviderId = 'deepseek-official'
  constructor(ctx) {
    super(ctx, 'web')
  }
  registerSearchProvider(p) {
    this.searchProviders.set(p.id, p)
    return () => this.searchProviders.delete(p.id)
  }
  async search() {
    return { used: this.searchProviderId }
  }
}

function plugin(ctx, config) {
  mod.apply(ctx, config)
}
plugin.inject = ['web']
plugin.Config = mod.Config

const root = new Context()
try {
  await root.plugin(WebRuntime)
  await root.plugin(plugin, {
    defaultServer: 'bailian',
    maxResults: 8,
    searchTimeoutMs: 30000,
    servers: [{ id: 'bailian', kind: 'bailian', apiKeyEnv: 'DASHSCOPE_API_KEY' }],
  })
  const raw = root.web[Symbol.for('cordis.original')]
  console.log(
    JSON.stringify(
      {
        ok: true,
        faceId: root.web.searchProviderId,
        rawId: raw?.searchProviderId,
        wrapped: !!raw?.search?.__searchMcpWrapped,
      },
      null,
      2,
    ),
  )
} catch (e) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        message: String(e?.message || e),
        stack: String(e?.stack || '').slice(0, 1200),
      },
      null,
      2,
    ),
  )
  process.exit(1)
}
