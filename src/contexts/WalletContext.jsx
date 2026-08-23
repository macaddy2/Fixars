import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useAuth } from './AuthContext'
import { isRealSessionEnabled } from '@/lib/flags'
import { isVestDenStakingEnabled } from '@/lib/features'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { fetchWallet, requestPayout } from '@/lib/sessionApi'

/**
 * WalletContext
 *
 * Three tiers, safest first:
 *
 * 1. Public demo (flag off): localStorage demo path for a signed-in demo
 *    user. Anonymous visitors get no dummy balances. Labels say "demo".
 *
 * 2. Mock server ledger (VITE_REAL_SESSION=1, no Supabase envs): numbers come
 *    from the flagged sessionApi mock ledger. spend() does NOT mutate local
 *    React state as money.
 *
 * 3. Supabase ledger (VITE_REAL_SESSION=1 AND Supabase envs configured):
 *    balance derives from the wallet_transactions ledger via the
 *    wallet_balance() RPC; debits go through the atomic wallet_spend() RPC.
 *    Credits land only from the payment webhook / verify-payment function —
 *    this client can never mint balance. Still not "live custody": rails are
 *    only as real as the deployed Paystack secrets behind them.
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
    // Tier 3 requires BOTH switches on — one deliberate act each.
    const supabaseLedger = Boolean(realSession && isSupabaseConfigured())

    const [demoBalance, setDemoBalance] = useState(() => load('wallet_balance', DEFAULT_BALANCE))
    const [demoTransactions, setDemoTransactions] = useState(() => load('wallet_txns', SEED_TRANSACTIONS))
    const [serverSnapshot, setServerSnapshot] = useState(null)
    const [fetchedForUserId, setFetchedForUserId] = useState(null)
    const [toast, setToast] = useState(null)

    // Ref mirror so synchronous validation never reads a stale closure value.
    const rpcBalanceRef = useRef(null)

    const ledgerLoading = Boolean(
        user && fetchedForUserId !== user.id && (realSession || supabaseLedger)
    )

    const notify = useCallback((message) => {
        setToast({ message, at: Date.now() })
    }, [])

    useEffect(() => {
        if (!toast) return
        const id = setTimeout(() => setToast(null), 2600)
        return () => clearTimeout(id)
    }, [toast])

    // ── Ledger fetch: Supabase tier ──
    useEffect(() => {
        if (!supabaseLedger || !user?.id) return undefined
        let cancelled = false

        async function loadRpcWallet() {
            try {
                const [balRes, txRes] = await Promise.all([
                    supabase.rpc('wallet_balance'),
                    supabase
                        .from('wallet_transactions')
                        .select('*')
                        .order('created_at', { ascending: false })
                        .limit(50),
                ])
                if (cancelled) return
                const balance = balRes.error ? null : Number(balRes.data) || 0
                rpcBalanceRef.current = balance
                setServerSnapshot({
                    available: balance,
                    held: 0,
                    source: 'supabase-ledger',
                    entries: (txRes.error ? [] : (txRes.data || [])).map(t => ({
                        id: t.id,
                        type: t.type,
                        label: t.label,
                        amount: Number(t.amount),
                        app: t.app,
                        date: t.created_at?.slice(0, 10),
                    })),
                })
            } catch {
                if (!cancelled) setServerSnapshot(null)
            } finally {
                if (!cancelled) setFetchedForUserId(user.id)
            }
        }
        loadRpcWallet()
        return () => { cancelled = true }
    }, [supabaseLedger, user?.id])

    // ── Ledger fetch: mock-server tier (unchanged from flag design) ──
    useEffect(() => {
        if (!realSession || supabaseLedger || !user) return undefined
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
    }, [user, realSession, supabaseLedger])

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

    /**
     * Spend. Always resolves to { ok, error }. On the Supabase tier this hits
     * the atomic wallet_spend() RPC — insufficient funds are rejected
     * server-side, never just in the browser.
     */
    const spend = useCallback(async (amount, meta = {}) => {
        // ── Tier 3: Supabase ledger ──
        if (supabaseLedger) {
            if ((meta.type === 'stake' || meta.app === 'vestden') && !isVestDenStakingEnabled()) {
                return { ok: false, error: 'Staking is not available in this build' }
            }
            const value = Number(amount)
            if (!value || value <= 0) return { ok: false, error: 'Enter an amount greater than zero' }
            try {
                const { data, error } = await supabase.rpc('wallet_spend', {
                    p_amount: value,
                    p_label: meta.label || null,
                    p_app: meta.app || 'wallet',
                    p_type: meta.type || 'stake',
                })
                if (error) return { ok: false, error: error.message }
                rpcBalanceRef.current = Number(data) || 0
                setServerSnapshot(prev => prev && {
                    ...prev,
                    available: rpcBalanceRef.current,
                    entries: [
                        {
                            id: `t${Date.now()}`,
                            type: meta.type || 'stake',
                            label: meta.label || 'Wallet debit',
                            amount: -value,
                            app: meta.app || 'wallet',
                            date: new Date().toISOString().slice(0, 10),
                        },
                        ...prev.entries,
                    ],
                })
                return { ok: true }
            } catch (err) {
                return { ok: false, error: err.message || 'Wallet debit failed' }
            }
        }

        // ── Tier 2: mock server ledger ──
        if (realSession) {
            return { ok: false, error: 'Wallet ledger is server-side. This client cannot mint or spend naira.' }
        }

        // ── Tier 1: public demo ──
        if (!user) return { ok: false, error: 'Sign in to use the demo wallet' }
        const value = Number(amount)
        if (!value || value <= 0) return { ok: false, error: 'Enter an amount greater than zero' }
        if ((meta.type === 'stake' || meta.app === 'vestden') && !isVestDenStakingEnabled()) {
            return { ok: false, error: 'Staking is not available in this build' }
        }
        const current = rpcBalanceRef.current ?? demoBalance
        if (value > current) return { ok: false, error: 'Amount exceeds your wallet balance' }
        rpcBalanceRef.current = current - value
        setDemoBalance(b => b - value)
        record(-value, { label: meta.label || 'Wallet debit', app: meta.app || 'wallet', type: meta.type || 'stake' })
        return { ok: true }
    }, [supabaseLedger, realSession, user, demoBalance, record])

    const deposit = useCallback((amount, meta = {}) => {
        if (supabaseLedger) {
            return { ok: false, error: 'Deposits complete via checkout — use the Fund button.' }
        }
        if (realSession) {
            return { ok: false, error: 'Wallet ledger is server-side. This client cannot credit naira.' }
        }
        if (!user) return { ok: false, error: 'Sign in to use the demo wallet' }
        const value = Number(amount)
        if (!value || value <= 0) return { ok: false, error: 'Enter a valid amount' }
        const current = rpcBalanceRef.current ?? demoBalance
        rpcBalanceRef.current = current + value
        setDemoBalance(b => b + value)
        record(value, { label: meta.label || 'Wallet credit', app: meta.app || 'wallet', type: meta.type || 'topup' })
        return { ok: true }
    }, [supabaseLedger, realSession, user, demoBalance, record])

    const payout = useCallback(async (amount, destination) => {
        if (supabaseLedger) {
            return { ok: false, error: 'Withdrawals are not enabled yet. Not a live-money path.' }
        }
        if (!realSession) {
            return { ok: false, error: 'Mock debit is only on the flagged server ledger. Not a live-money path.' }
        }
        const result = await requestPayout({ amount, destination })
        if (result.ok) setServerSnapshot(result.snapshot)
        return result
    }, [supabaseLedger, realSession])

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
