/**
 * Prove unwrap + direct web.search wrap routes off deepseek-official.
 * Run: node scripts/_verify-takeover.mjs
 */
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const profilesNm = join(process.env.USERPROFILE || '', '.dsh', 'profiles', 'node_modules')
const require = createRequire(join(profilesNm, 'package.json'))
const { Context, Service } = require('@deepseek-ai/cordis')
const { apply } = await import(pathToFileURL(join(pkgRoot, 'lib', 'index.js')).href)
const ORIGINAL = Symbol.for('cordis.original')

class WebRuntime extends Service {
  searchProviders = new Map()
  searchProviderId
  constructor(ctx, config = {}) {
    super(ctx, 'web')
    this.searchProviderId = config.searchProvider ?? 'deepseek-official'
  }
  registerSearchProvider(p) {
    this.searchProviders.set(p.id, p)
    return () => this.searchProviders.delete(p.id)
  }
  async search() {
    if (this.searchProviderId === 'deepseek-official') {
      return { used: 'deepseek-official', error: 'DeepSeek API error (HTTP 401)' }
    }
    const p = this.searchProviders.get(this.searchProviderId)
    return { used: this.searchProviderId, via: p?.id }
  }
}

const smcp = Object.assign(function (ctx) {
  apply(ctx, {
    defaultServer: 'bailian',
    maxResults: 8,
    searchTimeoutMs: 30000,
    servers: [{ id: 'bailian', kind: 'bailian', apiKeyEnv: 'DASHSCOPE_API_KEY' }],
  })
}, { inject: ['web'] })

const app = new Context()
await app.plugin(WebRuntime, { searchProvider: 'deepseek-official' })
const fiber = await app.plugin(smcp)

const raw = app.web[ORIGINAL]
let thrown
try {
  await app.web.search({ query: 'venezuela', maxResults: 5 })
} catch (error) {
  thrown = String(error?.message || error)
}

const enabledOk =
  raw.searchProviderId === 'search-mcp'
  && raw.search.__searchMcpWrapped === true
  && /search-mcp/.test(thrown || '')

await fiber.dispose()
const afterDisable = await app.web.search({ query: 'venezuela', maxResults: 5 })
const disabledOk =
  raw.searchProviderId === 'deepseek-official'
  && !raw.search.__searchMcpWrapped
  && afterDisable?.used === 'deepseek-official'

const ok = enabledOk && disabledOk
console.log(JSON.stringify({
  ok,
  enabledOk,
  disabledOk,
  thrown: thrown?.slice(0, 160),
  afterDisable,
  rawId: raw.searchProviderId,
}, null, 2))
process.exit(ok ? 0 : 1)
