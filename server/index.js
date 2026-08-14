import { existsSync } from 'node:fs'
import { createServer } from 'node:http'
import { resolve } from 'node:path'
import { createApp } from './app.js'
import { createStaticHandler } from './static.js'
import { pathnameOf } from './http-util.js'

const realSession = process.env.REAL_SESSION === '1'
const port = Number(process.env.PORT || 3000)
const distDir = resolve(process.env.STATIC_DIR || 'dist')

if (realSession && !process.env.SESSION_SECRET) {
    console.warn('[fixars] REAL_SESSION=1 without SESSION_SECRET — refusing to start. Set a server-only secret.')
    process.exit(1)
}

if (realSession && (process.env.SESSION_SECRET === 'dev' || process.env.SESSION_SECRET === 'secret')) {
    console.warn('[fixars] SESSION_SECRET looks weak. Use a long random value on any shared host.')
}

const { handler: apiHandler } = createApp({
    realSession,
    sessionSecret: process.env.SESSION_SECRET,
})

const serveStatic = existsSync(distDir) ? createStaticHandler(distDir) : null

const server = createServer(async (req, res) => {
    const path = pathnameOf(req)
    if (path.startsWith('/api/')) {
        await apiHandler(req, res)
        return
    }
    if (serveStatic) {
        serveStatic(req, res)
        return
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(realSession
        ? 'API only — no dist/ to serve. Run the Vite dev server and proxy /api.'
        : 'Static build missing. Run npm run build, or set REAL_SESSION=1 for the API.')
})

server.listen(port, '0.0.0.0', () => {
    console.log(`[fixars] listening on ${port} realSession=${realSession} static=${Boolean(serveStatic)}`)
})
