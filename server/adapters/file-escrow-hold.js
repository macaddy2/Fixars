import { randomBytes } from 'node:crypto'
import { join } from 'node:path'
import { createJsonFileStore } from './json-file-store.js'

/**
 * File-backed EscrowHold. Same port as the in-process mock.
 * Not bank-grade. No licensed custody.
 */
export function createFileEscrowHold({ dataDir, ledger } = {}) {
    if (!dataDir) throw new Error('createFileEscrowHold requires dataDir')
    const store = createJsonFileStore(join(dataDir, 'escrow.json'), { holds: {} })

    return {
        async list(userId) {
            const data = store.read()
            return Object.values(data.holds)
                .filter((h) => h.userId === userId)
                .map((h) => ({ ...h }))
        },

        async hold({ userId, amount, ref }) {
            const value = Number(amount)
            if (!userId || !Number.isFinite(value) || value <= 0) {
                const err = new Error('hold requires userId and a positive amount')
                err.code = 'INVALID_HOLD'
                throw err
            }
            if (ledger?.holdFromAvailable) {
                await ledger.holdFromAvailable(userId, value)
            }
            const data = store.read()
            const record = {
                id: `esc_${randomBytes(8).toString('hex')}`,
                userId,
                amount: value,
                status: 'held',
                ref: ref || null,
                liveRails: false,
                provider: 'mock',
            }
            data.holds[record.id] = record
            store.write(data)
            return { ...record }
        },

        async release(holdId) {
            const data = store.read()
            const record = data.holds[holdId]
            if (!record) {
                const err = new Error('Escrow hold not found')
                err.code = 'NOT_FOUND'
                throw err
            }
            if (record.status !== 'held') {
                const err = new Error(`Hold is ${record.status}`)
                err.code = 'INVALID_STATE'
                throw err
            }
            if (ledger?.releaseHeld) {
                await ledger.releaseHeld(record.userId, record.amount)
            }
            record.status = 'released'
            store.write(data)
            return { ...record }
        },

        async refund(holdId) {
            const data = store.read()
            const record = data.holds[holdId]
            if (!record) {
                const err = new Error('Escrow hold not found')
                err.code = 'NOT_FOUND'
                throw err
            }
            if (record.status !== 'held') {
                const err = new Error(`Hold is ${record.status}`)
                err.code = 'INVALID_STATE'
                throw err
            }
            if (ledger?.releaseHeld) {
                await ledger.releaseHeld(record.userId, record.amount)
            }
            record.status = 'refunded'
            store.write(data)
            return { ...record }
        },
    }
}
