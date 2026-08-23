import { existsSync } from 'node:fs'
import { createServer } from 'node:http'
import { resolve } from 'node:path'
import { createApp } from './app.js'
import { createStaticHandler } from './static.js'
import { pathnameOf } from './http-util.js'
import { isRealSessionFlag } from './flags.js'
import { assertSessionSecret } from './session-secret.js'

const realSession = isRealSessionFlag()
const port = Number(process.env.PORT || 3000)
const distDir = resolve(process.env.STATIC_DIR || 'dist')

if (realSession) {
    try {
        assertSessionSecret(process.env.SESSION_SECRET)
    } catch (err) {
        console.error(`[fixars] ${err.message}`)
        process.exit(1)
    }
}

const { handler: apiHandler } = createApp({
    realSession,
    sessionSecret: process.env.SESSION_SECRET,
    secureCookie: process.env.COOKIE_SECURE === '1',
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
        : 'Static build missing. Run npm run build.')
})

server.listen(port, '0.0.0.0', () => {
    console.log(`[fixars] listening on ${port} realSession=${realSession} static=${Boolean(serveStatic)}`)
})
