import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.webp': 'image/webp',
    '.map': 'application/json',
}

export function createStaticHandler(rootDir) {
    const root = resolve(rootDir)

    return function serveStatic(req, res) {
        const host = req.headers.host || '127.0.0.1'
        let rel = decodeURIComponent(new URL(req.url, `http://${host}`).pathname)
        if (rel === '/') rel = '/index.html'
        const unsafe = normalize(rel).replace(/^(\.\.(\/|\\|$))+/, '')
        const file = join(root, unsafe)

        const sendFile = (path) => {
            const type = MIME[extname(path)] || 'application/octet-stream'
            res.writeHead(200, { 'Content-Type': type })
            createReadStream(path).pipe(res)
        }

        if (file.startsWith(root) && existsSync(file) && statSync(file).isFile()) {
            sendFile(file)
            return
        }

        const index = join(root, 'index.html')
        if (existsSync(index)) {
            sendFile(index)
            return
        }

        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('Not found')
    }
}
