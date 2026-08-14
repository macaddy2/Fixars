/**
 * Plug-and-play ports for session, naira ledger, holder/escrow, and KYC.
 *
 * These are interfaces only. Ship mock adapters. A licensed DMB/MMO letter,
 * or a NIN/BVN identity adapter, can implement the same methods later
 * without changing route handlers.
 *
 * No live rails in this tree. No named bank. No live NIMC/NIBSS/Smile/Dojah call.
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
 * @typedef {object} HolderInfo
 * @property {boolean} liveRails
 * @property {boolean} holdsClientMoney
 * @property {string} holder  // always 'prototype' on the mock — never a bank name
 * @property {string} intendedAfter
 * @property {string} provider
 * @property {string} note
 */

/**
 * @typedef {object} EscrowRecord
 * @property {string} id
 * @property {string} userId
 * @property {number} amount
 * @property {string} status
 * @property {string} [ref]
 * @property {boolean} liveRails
 * @property {boolean} holdsClientMoney
 * @property {string} holder
 * @property {string} intendedAfter
 */

/**
 * Holder / EscrowHold — hold / release / refund / list / info.
 * A licensed DMB or MMO implements this after a letter.
 * This prototype does not hold client money.
 *
 * @typedef {object} EscrowHold
 * @property {(userId: string) => Promise<EscrowRecord[]>} list
 * @property {(input: { userId: string, amount: number, ref?: string }) => Promise<EscrowRecord>} hold
 * @property {(holdId: string) => Promise<EscrowRecord>} release
 * @property {(holdId: string) => Promise<EscrowRecord>} refund
 * @property {() => Promise<HolderInfo>} info
 */

/**
 * @typedef {object} KycStatus
 * @property {string} userId
 * @property {string} status
 * @property {string} provider
 * @property {boolean} liveNetwork
 * @property {string} note
 * @property {string} [channel]
 */

/**
 * KycProvider — NIN (NIMC) and BVN interface.
 * A licensed identity adapter implements verifyNin / verifyBvn later.
 * The mock must set liveNetwork: false and must not claim a live check.
 *
 * @typedef {object} KycProvider
 * @property {(userId: string) => Promise<KycStatus>} getStatus
 * @property {(userId: string, payload?: object) => Promise<KycStatus>} startVerification
 * @property {(userId: string, nin?: string) => Promise<KycStatus>} verifyNin
 * @property {(userId: string, bvn?: string) => Promise<KycStatus>} verifyBvn
 */

const HOLDER_METHODS = ['list', 'hold', 'release', 'refund', 'info']

export const PORT_METHODS = Object.freeze({
    SessionStore: ['create', 'get', 'destroy'],
    WalletLedger: ['getSnapshot', 'credit', 'debit', 'payout'],
    EscrowHold: HOLDER_METHODS,
    Holder: HOLDER_METHODS,
    KycProvider: ['getStatus', 'startVerification', 'verifyNin', 'verifyBvn'],
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
