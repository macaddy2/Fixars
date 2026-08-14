import { randomBytes } from 'node:crypto'
import { decorateHold, HOLDER_INFO } from '../holder-meta.js'

/**
 * In-process mock Holder / EscrowHold.
 * This prototype does not hold client money. No named bank.
 */
export function createMockEscrowHold({ ledger } = {}) {
    const holds = new Map()

    return {
        async info() {
            return { ...HOLDER_INFO }
        },

        async list(userId) {
            return [...holds.values()]
                .filter((h) => h.userId === userId)
                .map((h) => decorateHold(h))
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
            const record = decorateHold({
                id: `esc_${randomBytes(8).toString('hex')}`,
                userId,
                amount: value,
                status: 'held',
                ref: ref || null,
            })
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
            return decorateHold(record)
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
            return decorateHold(record)
        },
    }
}
