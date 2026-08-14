import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

/**
 * Atomic JSON file store. write() fsyncs a temp file then renames over the
 * target so a process restart reloads the last complete snapshot.
 */
export function createJsonFileStore(filePath, fallback = {}) {
    mkdirSync(dirname(filePath), { recursive: true })

    function read() {
        if (!existsSync(filePath)) return structuredClone(fallback)
        return JSON.parse(readFileSync(filePath, 'utf8'))
    }

    function write(data) {
        const tmp = `${filePath}.${process.pid}.tmp`
        writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
        const fd = openSync(tmp, 'r+')
        try {
            fsyncSync(fd)
        } finally {
            closeSync(fd)
        }
        renameSync(tmp, filePath)
    }

    return { path: filePath, read, write }
}
