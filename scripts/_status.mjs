import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const profile = JSON.parse(readFileSync(join(homedir(), '.dsh/profiles/desktop/package.json'), 'utf8'))
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)))
const c = readFileSync(new URL('../lib/client.browser.js', import.meta.url), 'utf8')
console.log(JSON.stringify({
  inBundles: profile.dsh.profile.bundles.includes('dsh-search-mcp'),
  ver: pkg.version,
  imm: pkg.dsh.client.immediately,
  lines: c.split(/\n/).length,
  settingsScopeInject: /inject\(\["settingsScope"\]/.test(c),
  configFormsInject: /inject\(\["configForms"\]/.test(c),
  configFormsPoll: c.includes('configForms poll'),
  settingsSection: /name:\s*"settings\.section"/.test(c),
  forcedFallback: /const createSnapshotStore = createSnapshotStoreFallback/.test(c),
  SearchMcpSection: c.includes('SearchMcpSection'),
  Placeholder: c.includes('PlaceholderSection') || c.includes('配置表单加载中'),
}, null, 2))
