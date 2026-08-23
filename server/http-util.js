import { createHash } from 'node:crypto'

export function userIdFromEmail(email) {
    const normalized = String(email).trim().toLowerCase()
    return `usr_${createHash('sha256').update(normalized).digest('hex').slice(0, 16)}`
}

export function parseJsonBody(req, { limit = 32 * 1024 } = {}) {
    return new Promise((resolve, reject) => {
        const chunks = []
        let size = 0
        req.on('data', (chunk) => {
            size += chunk.length
            if (size > limit) {
                const err = new Error('Payload too large')
                err.code = 'PAYLOAD_TOO_LARGE'
                reject(err)
                req.destroy()
                return
            }
            chunks.push(chunk)
        })
        req.on('end', () => {
            if (chunks.length === 0) {
                resolve({})
                return
            }
            try {
                resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
            } catch {
                const err = new Error('Invalid JSON')
                err.code = 'INVALID_JSON'
                reject(err)
            }
        })
        req.on('error', reject)
    })
}

export function sendJson(res, status, body, extraHeaders = {}) {
    const payload = JSON.stringify(body)
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        ...extraHeaders,
    })
    res.end(payload)
}

export function pathnameOf(req) {
    const host = req.headers.host || '127.0.0.1'
    return new URL(req.url, `http://${host}`).pathname
}
