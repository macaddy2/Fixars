import { randomBytes } from 'node:crypto'

function entryId() {
    return `le_${randomBytes(8).toString('hex')}`
}

function today() {
    return new Date().toISOString().slice(0, 10)
}

function assertAmount(amount) {
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
        const err = new Error('Amount must be greater than zero')
        err.code = 'INVALID_AMOUNT'
        throw err
    }
    return value
}

/**
 * In-process mock WalletLedger. Not client funds. No Paystack / NIP / bank call.
 */
export function createMockWalletLedger({ openingAvailable = 0 } = {}) {
    const accounts = new Map()

    function ensure(userId) {
        if (!userId) throw new Error('userId is required')
        if (!accounts.has(userId)) {
            accounts.set(userId, {
                available: openingAvailable,
                held: 0,
                entries: [],
            })
        }
        return accounts.get(userId)
    }

    function snapshot(userId) {
        const acct = ensure(userId)
        return {
            available: acct.available,
            held: acct.held,
            currency: 'NGN',
            source: 'mock-ledger',
            liveRails: false,
            entries: acct.entries.map((e) => ({ ...e })),
        }
    }

    function push(acct, type, amount, meta = {}) {
        acct.entries.unshift({
            id: entryId(),
            type,
            amount,
            label: meta.label || type,
            app: meta.app || 'wallet',
            date: meta.date || today(),
        })
    }

    return {
        async getSnapshot(userId) {
            return snapshot(userId)
        },

        async credit(userId, amount, meta = {}) {
            const value = assertAmount(amount)
            const acct = ensure(userId)
            acct.available += value
            push(acct, meta.type || 'credit', value, meta)
            return snapshot(userId)
        },

        async debit(userId, amount, meta = {}) {
            const value = assertAmount(amount)
            const acct = ensure(userId)
            if (value > acct.available) {
                const err = new Error('Amount exceeds available balance')
                err.code = 'INSUFFICIENT_FUNDS'
                throw err
            }
            acct.available -= value
            push(acct, meta.type || 'debit', -value, meta)
            return snapshot(userId)
        },

        async payout(userId, amount, meta = {}) {
            return this.debit(userId, amount, {
                ...meta,
                type: 'payout',
                label: meta.label || 'Mock payout — no live processor',
            })
        },

        async holdFromAvailable(userId, amount) {
            const value = assertAmount(amount)
            const acct = ensure(userId)
            if (value > acct.available) {
                const err = new Error('Amount exceeds available balance')
                err.code = 'INSUFFICIENT_FUNDS'
                throw err
            }
            acct.available -= value
            acct.held += value
            return snapshot(userId)
        },

        async releaseHeld(userId, amount) {
            const value = assertAmount(amount)
            const acct = ensure(userId)
            if (value > acct.held) {
                const err = new Error('Amount exceeds held balance')
                err.code = 'INSUFFICIENT_HELD'
                throw err
            }
            acct.held -= value
            acct.available += value
            return snapshot(userId)
        },
    }
}
