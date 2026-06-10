import { createContext, useContext, useState, useCallback, useEffect } from 'react'

/**
 * WalletContext — the shared, spendable wallet balance (v2 model).
 *
 * Holds a single ₦ balance plus a running transaction ledger, persisted to
 * localStorage so a stake placed on one screen is reflected everywhere
 * (WalletPage balance, Home wallet stat, future analytics). `spend` is the
 * primitive the stake flow uses; it validates funds and records a signed
 * transaction. A lightweight navy toast surfaces every simulated action.
 */

const WalletContext = createContext(null)

const DEFAULT_BALANCE = 284500

const SEED_TRANSACTIONS = [
    { id: 't1', type: 'reward', label: 'Idea validated — payout', amount: 60000, app: 'conceptnexus', date: '2026-06-06' },
    { id: 't2', type: 'stake', label: 'Stake · SolarShare Lagos', amount: -50000, app: 'vestden', date: '2026-06-04' },
    { id: 't3', type: 'escrow', label: 'Milestone 2 released', amount: 120000, app: 'collaboard', date: '2026-06-01' },
    { id: 't4', type: 'topup', label: 'Top-up · bank transfer', amount: 150000, app: 'wallet', date: '2026-05-28' },
]

function load(key, fallback) {
    try {
        const raw = localStorage.getItem(key)
        return raw != null ? JSON.parse(raw) : fallback
    } catch {
        return fallback
    }
}

export function WalletProvider({ children }) {
    const [balance, setBalance] = useState(() => load('wallet_balance', DEFAULT_BALANCE))
    const [transactions, setTransactions] = useState(() => load('wallet_txns', SEED_TRANSACTIONS))
    const [toast, setToast] = useState(null)

    useEffect(() => { localStorage.setItem('wallet_balance', JSON.stringify(balance)) }, [balance])
    useEffect(() => { localStorage.setItem('wallet_txns', JSON.stringify(transactions)) }, [transactions])

    const notify = useCallback((message) => {
        setToast({ message, at: Date.now() })
    }, [])

    useEffect(() => {
        if (!toast) return
        const id = setTimeout(() => setToast(null), 2600)
        return () => clearTimeout(id)
    }, [toast])

    const record = useCallback((amount, { label, app, type }) => {
        setTransactions(prev => [
            { id: `t${Date.now()}`, type, label, amount, app, date: new Date().toISOString().slice(0, 10) },
            ...prev,
        ])
    }, [])

    // Spend from the wallet. Returns { ok, error } so callers can show errors.
    const spend = useCallback((amount, meta = {}) => {
        const value = Number(amount)
        if (!value || value <= 0) return { ok: false, error: 'Enter an amount greater than zero' }
        if (value > balance) return { ok: false, error: 'Amount exceeds your wallet balance' }
        setBalance(b => b - value)
        record(-value, { label: meta.label || 'Wallet debit', app: meta.app || 'wallet', type: meta.type || 'stake' })
        return { ok: true }
    }, [balance, record])

    const deposit = useCallback((amount, meta = {}) => {
        const value = Number(amount)
        if (!value || value <= 0) return { ok: false, error: 'Enter a valid amount' }
        setBalance(b => b + value)
        record(value, { label: meta.label || 'Wallet credit', app: meta.app || 'wallet', type: meta.type || 'topup' })
        return { ok: true }
    }, [record])

    return (
        <WalletContext.Provider value={{ balance, transactions, spend, deposit, toast, notify }}>
            {children}
        </WalletContext.Provider>
    )
}

export function useWallet() {
    const ctx = useContext(WalletContext)
    if (!ctx) throw new Error('useWallet must be used within a WalletProvider')
    return ctx
}
