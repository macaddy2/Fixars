import { randomBytes } from 'node:crypto'

/**
 * In-process mock EscrowHold. Not bank-grade. No licensed custody.
 */
export function createMockEscrowHold({ ledger } = {}) {
    const holds = new Map()

    return {
        async list(userId) {
            return [...holds.values()]
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
            const record = {
                id: `esc_${randomBytes(8).toString('hex')}`,
                userId,
                amount: value,
                status: 'held',
                ref: ref || null,
                liveRails: false,
                provider: 'mock',
            }
            holds.set(record.id, record)
            return { ...record }
        },

        async release(holdId) {
            const record = holds.get(holdId)
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
            return { ...record }
        },

        async refund(holdId) {
            const record = holds.get(holdId)
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
            return { ...record }
        },
    }
}
