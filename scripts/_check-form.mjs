import http from 'node:http'
import net from 'node:net'
import crypto from 'node:crypto'

const timeoutMs = 15000

function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: 3000 }, (res) => {
      let data = ''
      res.on('data', (c) => { data += c })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('http timeout')) })
  })
}

class Cdp {
  constructor(wsUrl) {
    this.wsUrl = wsUrl
    this.id = 0
    this.pending = new Map()
    this.buf = Buffer.alloc(0)
  }
  async connect() {
    const u = new URL(this.wsUrl)
    const key = crypto.randomBytes(16).toString('base64')
    await new Promise((resolve, reject) => {
      const socket = net.connect({ host: u.hostname, port: Number(u.port) }, () => {
        socket.write(
          `GET ${u.pathname}${u.search} HTTP/1.1\r\nHost: ${u.host}\r\n` +
          `Upgrade: websocket\r\nConnection: Upgrade\r\n` +
          `Sec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`,
        )
      })
      socket.setTimeout(timeoutMs)
      socket.on('timeout', () => reject(new Error('socket timeout')))
      socket.on('error', reject)
      socket.once('data', (chunk) => {
        if (!chunk.toString().includes('101')) return reject(new Error('upgrade fail'))
        this.socket = socket
        const rest = chunk.indexOf('\r\n\r\n')
        if (rest >= 0 && rest + 4 < chunk.length) this.buf = chunk.subarray(rest + 4)
        socket.on('data', (c) => this.onData(c))
        resolve()
      })
    })
  }
  onData(chunk) {
    this.buf = Buffer.concat([this.buf, chunk])
    while (true) {
      if (this.buf.length < 2) return
      let len = this.buf[1] & 0x7f
      let off = 2
      if (len === 126) {
        if (this.buf.length < 4) return
        len = this.buf.readUInt16BE(2)
        off = 4
      } else if (len === 127) {
        if (this.buf.length < 10) return
        len = Number(this.buf.readBigUInt64BE(2))
        off = 10
      }
      if (this.buf.length < off + len) return
      const payload = this.buf.subarray(off, off + len)
      this.buf = this.buf.subarray(off + len)
      try {
        const msg = JSON.parse(payload.toString())
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id)
          this.pending.delete(msg.id)
          msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
        }
      } catch { /* ignore */ }
    }
  }
  send(obj) {
    const data = Buffer.from(JSON.stringify(obj))
    const len = data.length
    let header
    if (len < 126) header = Buffer.from([0x81, 0x80 | len])
    else if (len < 65536) {
      header = Buffer.alloc(4)
      header[0] = 0x81
      header[1] = 0x80 | 126
      header.writeUInt16BE(len, 2)
    } else {
      header = Buffer.alloc(10)
      header[0] = 0x81
      header[1] = 0x80 | 127
      header.writeBigUInt64BE(BigInt(len), 2)
    }
    const mask = crypto.randomBytes(4)
    const masked = Buffer.alloc(len)
    for (let i = 0; i < len; i++) masked[i] = data[i] ^ mask[i % 4]
    this.socket.write(Buffer.concat([header, mask, masked]))
  }
  call(method, params = {}) {
    const id = ++this.id
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`timeout ${method}`))
      }, timeoutMs)
      this.pending.set(id, {
        resolve: (v) => { clearTimeout(t); resolve(v) },
        reject: (e) => { clearTimeout(t); reject(e) },
      })
      this.send({ id, method, params })
    })
  }
  close() {
    try { this.socket?.destroy() } catch { /* ignore */ }
  }
}

async function evalExpr(cdp, expression) {
  const result = await cdp.call('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  })
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
  return result.result?.value
}

const hard = setTimeout(() => { console.error('HARD_TIMEOUT'); process.exit(2) }, 90000)

try {
  // Ensure CDP
  let tabs
  try {
    tabs = await httpGetJson('http://127.0.0.1:9222/json')
  } catch {
    console.error('CDP not available')
    process.exit(5)
  }
  const page = tabs.find((t) => t.type === 'page' && t.webSocketDebuggerUrl)
  if (!page) throw new Error('no page')
  const cdp = new Cdp(page.webSocketDebuggerUrl)
  await cdp.connect()
  await cdp.call('Runtime.enable')

  const result = await evalExpr(cdp, `(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    const visible = (el) => !!(el && el.offsetParent !== null)
    const click = (el) => {
      if (!el) return false
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
      el.click?.()
      return true
    }
    const all = () => [...document.querySelectorAll('button,a,[role="button"],[role="tab"],[role="menuitem"],div,span,li,h1,h2,h3,p,label')]
    const byExact = (re) => all().find((e) => visible(e) && re.test((e.textContent || '').trim()))

    // Open settings
    click(byExact(/^设置$/) || all().find((e) => visible(e) && /settings|设置/i.test(e.getAttribute('aria-label') || '')))
    await sleep(900)

    // Click 搜索 MCP
    const nav = byExact(/^搜索\\s*MCP$/) || byExact(/^Search\\s*MCP$/i) ||
      all().find((e) => visible(e) && /搜索\\s*MCP|Search\\s*MCP/i.test((e.textContent || '').trim()) && (e.textContent || '').trim().length < 20)
    click(nav)
    await sleep(1200)

    const t = (document.body && document.body.innerText) || ''
    const smcp = !!document.querySelector('.smcp_section, .smcp_card, .smcp_lede, .smcp_footer, .smcp_btn')
    return {
      hasNav: !!nav,
      hasSmcpClass: smcp,
      hasSave: /保存|Save|丢弃|Discard/i.test(t),
      hasServerUi: /默认服务器|default server|快速添加|Quick add|添加服务器|maxResults|搜索超时|bailian|Tavily|Brave|Exa|自定义/i.test(t),
      hasPlaceholder: /表单暂时不可用|Visual editor|下一版挂回|Host defaults/i.test(t),
      panelSlice: t.replace(/\\s+/g, ' ').slice(Math.max(0, t.replace(/\\s+/g, ' ').indexOf('搜索 MCP')), Math.max(0, t.replace(/\\s+/g, ' ').indexOf('搜索 MCP')) + 500),
    }
  })()`)

  console.log(JSON.stringify(result, null, 2))
  cdp.close()
  clearTimeout(hard)
  process.exit(result.hasServerUi || result.hasSmcpClass ? 0 : 3)
} catch (e) {
  console.error(String(e && e.stack || e))
  clearTimeout(hard)
  process.exit(1)
}
