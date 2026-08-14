/* eslint-disable react-refresh/only-export-components -- context module */
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import { useAuth } from './AuthContext'
import { isRealSessionEnabled } from '@/lib/flags'
import { fetchWallet, requestPayout } from '@/lib/sessionApi'

/**
 * WalletContext
 *
 * Flag-on (VITE_REAL_SESSION): numbers come from the server WalletLedger.
 * spend() does not mutate local React state as money.
 *
 * Flag-off: existing public-demo localStorage path, only for a signed-in
 * demo user. Anonymous visitors get no dummy balances.
 */

const WalletContext = createContext(null)

const DEFAULT_BALANCE = 284500

const SEED_TRANSACTIONS = [
    { id: 't1', type: 'reward', label: 'Idea validated (demo)', amount: 60000, app: 'conceptnexus', date: '2026-06-06' },
    { id: 't2', type: 'stake', label: 'Demo stake · SolarShare Lagos', amount: -50000, app: 'vestden', date: '2026-06-04' },
    { id: 't3', type: 'escrow', label: 'Demo hold released', amount: 120000, app: 'collaboard', date: '2026-06-01' },
    { id: 't4', type: 'topup', label: 'Demo credit', amount: 150000, app: 'wallet', date: '2026-05-28' },
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
    const { user } = useAuth()
    const realSession = isRealSessionEnabled()

    const [demoBalance, setDemoBalance] = useState(() => load('wallet_balance', DEFAULT_BALANCE))
    const [demoTransactions, setDemoTransactions] = useState(() => load('wallet_txns', SEED_TRANSACTIONS))
    const [serverSnapshot, setServerSnapshot] = useState(null)
    const [fetchedForUserId, setFetchedForUserId] = useState(null)
    const [toast, setToast] = useState(null)
    const ledgerLoading = Boolean(realSession && user && fetchedForUserId !== user.id)

    const notify = useCallback((message) => {
        setToast({ message, at: Date.now() })
    }, [])

    useEffect(() => {
        if (!toast) return
        const id = setTimeout(() => setToast(null), 2600)
        return () => clearTimeout(id)
    }, [toast])

    useEffect(() => {
        if (!realSession || !user) return undefined
        let cancelled = false
        fetchWallet()
            .then((snapshot) => {
                if (cancelled) return
                setServerSnapshot(snapshot)
                setFetchedForUserId(user.id)
            })
            .catch(() => {
                if (cancelled) return
                setServerSnapshot(null)
                setFetchedForUserId(user.id)
            })
        return () => { cancelled = true }
    }, [user, realSession])

    useEffect(() => {
        if (realSession || !user) return
        localStorage.setItem('wallet_balance', JSON.stringify(demoBalance))
    }, [demoBalance, realSession, user])

    useEffect(() => {
        if (realSession || !user) return
        localStorage.setItem('wallet_txns', JSON.stringify(demoTransactions))
    }, [demoTransactions, realSession, user])

    const record = useCallback((amount, { label, app, type }) => {
        setDemoTransactions(prev => [
            { id: `t${Date.now()}`, type, label, amount, app, date: new Date().toISOString().slice(0, 10) },
            ...prev,
        ])
    }, [])

    const spend = useCallback((amount, meta = {}) => {
        if (realSession) {
            return { ok: false, error: 'Wallet ledger is server-side. This client cannot mint or spend naira.' }
        }
        if (!user) return { ok: false, error: 'Sign in to use the demo wallet' }
        const value = Number(amount)
        if (!value || value <= 0) return { ok: false, error: 'Enter an amount greater than zero' }
        if (value > demoBalance) return { ok: false, error: 'Amount exceeds your wallet balance' }
        setDemoBalance(b => b - value)
        record(-value, { label: meta.label || 'Wallet debit', app: meta.app || 'wallet', type: meta.type || 'stake' })
        return { ok: true }
    }, [demoBalance, realSession, record, user])

    const deposit = useCallback((amount, meta = {}) => {
        if (realSession) {
            return { ok: false, error: 'Wallet ledger is server-side. This client cannot credit naira.' }
        }
        if (!user) return { ok: false, error: 'Sign in to use the demo wallet' }
        const value = Number(amount)
        if (!value || value <= 0) return { ok: false, error: 'Enter a valid amount' }
        setDemoBalance(b => b + value)
        record(value, { label: meta.label || 'Wallet credit', app: meta.app || 'wallet', type: meta.type || 'topup' })
        return { ok: true }
    }, [realSession, record, user])

    const payout = useCallback(async (amount, destination) => {
        if (!realSession) {
            return { ok: false, error: 'Mock debit is only on the flagged server ledger. Not a live-money path.' }
        }
        const result = await requestPayout({ amount, destination })
        if (result.ok) setServerSnapshot(result.snapshot)
        return result
    }, [realSession])

    const value = useMemo(() => {
        if (!user) {
            return {
                balance: null,
                held: 0,
                transactions: [],
                spend,
                deposit,
                payout,
                toast,
                notify,
                source: realSession ? 'mock-ledger' : 'demo',
                liveRails: false,
                ledgerLoading: false,
                realSession,
            }
        }
        if (realSession) {
            return {
                balance: serverSnapshot?.available ?? null,
                held: serverSnapshot?.held || 0,
                transactions: serverSnapshot?.entries || [],
                spend,
                deposit,
                payout,
                toast,
                notify,
                source: serverSnapshot?.source || 'mock-ledger',
                liveRails: false,
                ledgerLoading,
                realSession,
            }
        }
        return {
            balance: demoBalance,
            held: 0,
            transactions: demoTransactions,
            spend,
            deposit,
            payout,
            toast,
            notify,
            source: 'demo',
            liveRails: false,
            ledgerLoading: false,
            realSession,
        }
    }, [
        user, realSession, serverSnapshot, demoBalance, demoTransactions,
        spend, deposit, payout, toast, notify, ledgerLoading,
    ])

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    )
}

export function useWallet() {
    const ctx = useContext(WalletContext)
    if (!ctx) throw new Error('useWallet must be used within a WalletProvider')
    return ctx
}
