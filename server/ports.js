/**
 * Plug-and-play ports for session, naira ledger, escrow, and KYC.
 *
 * These are interfaces only. Ship mock adapters. A licensed bank, Paystack,
 * Flutterwave, NIMC, or NIBSS adapter can implement the same methods later
 * without changing route handlers.
 *
 * No live rails in this tree.
 */

/**
 * @typedef {object} SessionUser
 * @property {string} id
 * @property {string} email
 * @property {string} name
 */

/**
 * @typedef {object} SessionRecord
 * @property {string} id
 * @property {SessionUser} user
 * @property {number} expiresAt
 */

/**
 * SessionStore — server-side session source of truth.
 * The client cannot mint a record; only create() issues one.
 *
 * @typedef {object} SessionStore
 * @property {(user: SessionUser, opts?: { ttlMs?: number }) => Promise<SessionRecord>} create
 * @property {(sessionId: string) => Promise<SessionRecord | null>} get
 * @property {(sessionId: string) => Promise<void>} destroy
 */

/**
 * @typedef {object} LedgerEntry
 * @property {string} id
 * @property {string} type
 * @property {number} amount
 * @property {string} label
 * @property {string} [app]
 * @property {string} date
 */

/**
 * @typedef {object} WalletSnapshot
 * @property {number} available
 * @property {number} held
 * @property {string} currency
 * @property {string} source
 * @property {boolean} liveRails
 * @property {LedgerEntry[]} entries
 */

/**
 * WalletLedger — naira figures live here, not in React state.
 *
 * @typedef {object} WalletLedger
 * @property {(userId: string) => Promise<WalletSnapshot>} getSnapshot
 * @property {(userId: string, amount: number, meta?: object) => Promise<WalletSnapshot>} credit
 * @property {(userId: string, amount: number, meta?: object) => Promise<WalletSnapshot>} debit
 * @property {(userId: string, amount: number, meta?: object) => Promise<WalletSnapshot>} payout
 */

/**
 * @typedef {object} EscrowRecord
 * @property {string} id
 * @property {string} userId
 * @property {number} amount
 * @property {string} status
 * @property {string} [ref]
 * @property {boolean} liveRails
 */

/**
 * EscrowHold — hold / release / refund. Mock only until a bank adapter exists.
 *
 * @typedef {object} EscrowHold
 * @property {(userId: string) => Promise<EscrowRecord[]>} list
 * @property {(input: { userId: string, amount: number, ref?: string }) => Promise<EscrowRecord>} hold
 * @property {(holdId: string) => Promise<EscrowRecord>} release
 * @property {(holdId: string) => Promise<EscrowRecord>} refund
 */

/**
 * @typedef {object} KycStatus
 * @property {string} userId
 * @property {string} status
 * @property {string} provider
 * @property {boolean} liveNetwork
 * @property {string} note
 */

/**
 * KycProvider — NIMC / NIBSS / Smile can implement this later.
 * The mock must never claim a live identity-network check.
 *
 * @typedef {object} KycProvider
 * @property {(userId: string) => Promise<KycStatus>} getStatus
 * @property {(userId: string, payload?: object) => Promise<KycStatus>} startVerification
 */

export const PORT_METHODS = Object.freeze({
    SessionStore: ['create', 'get', 'destroy'],
    WalletLedger: ['getSnapshot', 'credit', 'debit', 'payout'],
    EscrowHold: ['list', 'hold', 'release', 'refund'],
    KycProvider: ['getStatus', 'startVerification'],
})

export function assertPort(name, impl) {
    if (!impl || typeof impl !== 'object') {
        throw new Error(`${name} adapter is required`)
    }
    for (const method of PORT_METHODS[name]) {
        if (typeof impl[method] !== 'function') {
            throw new Error(`${name} adapter missing ${method}()`)
        }
    }
    return impl
}
