import http from 'node:http'
import net from 'node:net'
import crypto from 'node:crypto'

const timeoutMs = 12000

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
  return result.result?.value
}

const timer = setTimeout(() => {
  console.error('HARD_TIMEOUT')
  process.exit(2)
}, 60000)

try {
  const tabs = await httpGetJson('http://127.0.0.1:9222/json')
  const page = tabs.find((t) => t.type === 'page' && t.webSocketDebuggerUrl)
  if (!page) throw new Error('no page')
  const cdp = new Cdp(page.webSocketDebuggerUrl)
  await cdp.connect()
  await cdp.call('Runtime.enable')

  const boot = await evalExpr(cdp, `(() => {
    const t = (document.body && document.body.innerText) || ''
    return {
      loading: /Loading plugins/i.test(t),
      bad: /unavailable|无法使用|web boot|did not activate/i.test(t),
      head: t.replace(/\\s+/g, ' ').slice(0, 160),
    }
  })()`)
  console.log('boot', JSON.stringify(boot))

  // Open settings if needed
  await evalExpr(cdp, `(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    const click = (el) => { el?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window })); el?.click?.() }
    const byText = (re) => [...document.querySelectorAll('button,a,[role="button"],div,span')].find((e) => re.test((e.textContent||'').trim()) && e.offsetParent !== null)
    // Prefer sidebar gear / 设置
    let btn = byText(/^设置$|^Settings$/i) || byText(/设置|Settings/)
    if (btn) { click(btn); await sleep(800) }
    return { opened: !!btn }
  })()`)

  await new Promise((r) => setTimeout(r, 1000))

  const nav = await evalExpr(cdp, `(() => {
    const t = (document.body && document.body.innerText) || ''
    const items = [...document.querySelectorAll('button,a,[role="tab"],[role="menuitem"],nav *')]
      .map((e) => (e.textContent||'').replace(/\\s+/g,' ').trim())
      .filter((s) => s && s.length < 40)
    const uniq = [...new Set(items)]
    return {
      hasSearchMcp: /搜索\\s*MCP|Search\\s*MCP/i.test(t),
      hasNetx: /Netx\\s*Ops|NetX/i.test(t),
      sidebarHits: uniq.filter((s) => /搜索|Search|MCP|Netx|定时|插件|设置/i.test(s)).slice(0, 40),
      head: t.replace(/\\s+/g, ' ').slice(0, 300),
    }
  })()`)
  console.log('nav', JSON.stringify(nav, null, 2))
  cdp.close()
  clearTimeout(timer)
  process.exit(nav?.hasSearchMcp ? 0 : 3)
} catch (e) {
  console.error(String(e && e.stack || e))
  clearTimeout(timer)
  process.exit(1)
}
