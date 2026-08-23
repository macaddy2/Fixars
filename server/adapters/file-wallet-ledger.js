import { randomBytes } from 'node:crypto'
import { join } from 'node:path'
import { createJsonFileStore } from './json-file-store.js'

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
 * File-backed WalletLedger. Same port as the in-process mock.
 * Not client funds. No Paystack / NIP / bank call.
 */
export function createFileWalletLedger({ dataDir, openingAvailable = 0 } = {}) {
    if (!dataDir) throw new Error('createFileWalletLedger requires dataDir')
    const store = createJsonFileStore(join(dataDir, 'wallet.json'), { accounts: {} })

    function loadAccount(userId) {
        if (!userId) throw new Error('userId is required')
        const data = store.read()
        if (!data.accounts[userId]) {
            data.accounts[userId] = {
                available: openingAvailable,
                held: 0,
                entries: [],
            }
        }
        return { data, acct: data.accounts[userId] }
    }

    function snapshotOf(acct) {
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
            const { data, acct } = loadAccount(userId)
            store.write(data)
            return snapshotOf(acct)
        },

        async credit(userId, amount, meta = {}) {
            const value = assertAmount(amount)
            const { data, acct } = loadAccount(userId)
            acct.available += value
            push(acct, meta.type || 'credit', value, meta)
            store.write(data)
            return snapshotOf(acct)
        },

        async debit(userId, amount, meta = {}) {
            const value = assertAmount(amount)
            const { data, acct } = loadAccount(userId)
            if (value > acct.available) {
                const err = new Error('Amount exceeds available balance')
                err.code = 'INSUFFICIENT_FUNDS'
                throw err
            }
            acct.available -= value
            push(acct, meta.type || 'debit', -value, meta)
            store.write(data)
            return snapshotOf(acct)
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
            const { data, acct } = loadAccount(userId)
            if (value > acct.available) {
                const err = new Error('Amount exceeds available balance')
                err.code = 'INSUFFICIENT_FUNDS'
                throw err
            }
            acct.available -= value
            acct.held += value
            store.write(data)
            return snapshotOf(acct)
        },

        async releaseHeld(userId, amount) {
            const value = assertAmount(amount)
            const { data, acct } = loadAccount(userId)
            if (value > acct.held) {
                const err = new Error('Amount exceeds held balance')
                err.code = 'INSUFFICIENT_HELD'
                throw err
            }
            acct.held -= value
            acct.available += value
            store.write(data)
            return snapshotOf(acct)
        },
    }
}
