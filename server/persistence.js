import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { createMemorySessionStore } from './adapters/memory-session-store.js'
import { createMockWalletLedger } from './adapters/mock-wallet-ledger.js'
import { createMockEscrowHold } from './adapters/mock-escrow-hold.js'
import { createMockKycProvider } from './adapters/mock-kyc-provider.js'
import { createFileSessionStore } from './adapters/file-session-store.js'
import { createFileWalletLedger } from './adapters/file-wallet-ledger.js'
import { createFileEscrowHold } from './adapters/file-escrow-hold.js'

/**
 * Persistence wiring. Route handlers stay on the ports.
 *
 * PERSISTENCE=memory (default) — in-process, used by unit tests.
 * PERSISTENCE=file — JSON files under DATA_DIR (default ./data).
 *
 * KYC stays the in-process mock (liveNetwork: false). No NIMC call.
 * Holder / EscrowHold is the same object — a DMB/MMO adapter replaces it later.
 */
export function createMockPorts() {
    const ledger = createMockWalletLedger()
    const escrow = createMockEscrowHold({ ledger })
    return {
        sessions: createMemorySessionStore(),
        ledger,
        escrow,
        holder: escrow,
        kyc: createMockKycProvider(),
    }
}

export function createFilePorts({ dataDir, now } = {}) {
    const dir = resolve(dataDir || process.env.DATA_DIR || 'data')
    mkdirSync(dir, { recursive: true })
    const ledger = createFileWalletLedger({ dataDir: dir })
    const escrow = createFileEscrowHold({ dataDir: dir, ledger })
    return {
        sessions: createFileSessionStore({ dataDir: dir, now }),
        ledger,
        escrow,
        holder: escrow,
        kyc: createMockKycProvider(),
    }
}

export function createPorts(options = {}) {
    const persistence = options.persistence ?? process.env.PERSISTENCE ?? 'memory'
    if (persistence === 'file') return createFilePorts(options)
    return createMockPorts()
}
