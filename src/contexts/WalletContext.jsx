import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

/**
 * WalletContext — the shared, spendable ₦ wallet.
 *
 * Server mode (Supabase configured):
 *   Balance is DERIVED from the wallet_transactions ledger via the
 *   `wallet_balance()` RPC; debits go through `wallet_spend()` which validates
 *   funds atomically server-side. Credits arrive only from the payment
 *   webhook — the client can never mint balance.
 *
 * Mock mode (not configured):
 *   Same shape, backed by localStorage with a seeded demo ledger so the UI is
 *   fully explorable without a backend.
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
    const { user } = useAuth()
    const isConfigured = isSupabaseConfigured()

    const [balance, setBalance] = useState(() => (isConfigured ? 0 : load('wallet_balance', DEFAULT_BALANCE)))
    const [transactions, setTransactions] = useState(() => (isConfigured ? [] : load('wallet_txns', SEED_TRANSACTIONS)))
    const [loading, setLoading] = useState(isConfigured)
    const [toast, setToast] = useState(null)

    // Ref mirror of balance so synchronous validation never reads a stale
    // render-closure value (two rapid spends could otherwise both pass).
    const balanceRef = useRef(balance)

    useEffect(() => {
        balanceRef.current = balance
        if (!isConfigured) localStorage.setItem('wallet_balance', JSON.stringify(balance))
    }, [balance, isConfigured])
    useEffect(() => {
        if (!isConfigured) localStorage.setItem('wallet_txns', JSON.stringify(transactions))
    }, [transactions, isConfigured])

    // ── Load server-derived balance + recent ledger ──
    useEffect(() => {
        if (!isConfigured || !user?.id) return

        let cancelled = false
        async function loadWallet() {
            setLoading(true)
            try {
                const [balRes, txRes] = await Promise.all([
                    supabase.rpc('wallet_balance'),
                    supabase
                        .from('wallet_transactions')
                        .select('*')
                        .order('created_at', { ascending: false })
                        .limit(50)
                ])
                if (cancelled) return
                if (!balRes.error) setBalance(Number(balRes.data) || 0)
                if (!txRes.error) {
                    setTransactions((txRes.data || []).map(t => ({
                        id: t.id,
                        type: t.type,
                        label: t.label,
                        amount: Number(t.amount),
                        app: t.app,
                        date: t.created_at?.slice(0, 10),
                    })))
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        loadWallet()
        return () => { cancelled = true }
    }, [isConfigured, user?.id])

    const notify = useCallback((message) => {
        setToast({ message, at: Date.now() })
    }, [])

    useEffect(() => {
        if (!toast) return
        const id = setTimeout(() => setToast(null), 2600)
        return () => clearTimeout(id)
    }, [toast])

    const recordLocal = useCallback((amount, { label, app, type }) => {
        setTransactions(prev => [
            { id: `t${Date.now()}`, type, label, amount, app, date: new Date().toISOString().slice(0, 10) },
            ...prev,
        ])
    }, [])

    /**
     * Spend from the wallet. Returns { ok, error } so callers can show errors.
     * In server mode this hits the atomic `wallet_spend` RPC — an insufficient
     * balance is rejected server-side, not just in the browser.
     */
    const spend = useCallback(async (amount, meta = {}) => {
        const value = Number(amount)
        if (!value || value <= 0) return { ok: false, error: 'Enter an amount greater than zero' }

        if (isConfigured) {
            try {
                const { data, error } = await supabase.rpc('wallet_spend', {
                    p_amount: value,
                    p_label: meta.label || null,
                    p_app: meta.app || 'wallet',
                    p_type: meta.type || 'stake'
                })
                if (error) return { ok: false, error: error.message }
                setBalance(Number(data) || 0)
                recordLocal(-value, { label: meta.label || 'Wallet debit', app: meta.app || 'wallet', type: meta.type || 'stake' })
                return { ok: true }
            } catch (err) {
                return { ok: false, error: err.message || 'Wallet debit failed' }
            }
        }

        // Mock mode
        if (value > balanceRef.current) return { ok: false, error: 'Amount exceeds your wallet balance' }
        balanceRef.current -= value
        setBalance(b => b - value)
        recordLocal(-value, { label: meta.label || 'Wallet debit', app: meta.app || 'wallet', type: meta.type || 'stake' })
        return { ok: true }
    }, [isConfigured, recordLocal])

    /**
     * Credit the wallet. Only meaningful in mock mode — in server mode deposits
     * are created exclusively by the payment webhook (service role), so the
     * client cannot fabricate credits.
     */
    const deposit = useCallback((amount, meta = {}) => {
        const value = Number(amount)
        if (!value || value <= 0) return { ok: false, error: 'Enter a valid amount' }

        if (isConfigured) {
            return { ok: false, error: 'Deposits complete via checkout — use the Fund button.' }
        }

        balanceRef.current += value
        setBalance(b => b + value)
        recordLocal(value, { label: meta.label || 'Wallet credit', app: meta.app || 'wallet', type: meta.type || 'topup' })
        return { ok: true }
    }, [isConfigured, recordLocal])

    return (
        <WalletContext.Provider value={{ balance, transactions, spend, deposit, toast, notify, loading }}>
            {children}
        </WalletContext.Provider>
    )
}

export function useWallet() {
    const ctx = useContext(WalletContext)
    if (!ctx) throw new Error('useWallet must be used within a WalletProvider')
    return ctx
}
