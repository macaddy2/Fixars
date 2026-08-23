/**
 * Ledger — the user-facing Decision Log ("Receipts").
 *
 * Normalizes the app's three existing histories (wallet transactions, points
 * history, activity feed) into one append-only-shaped ledger entry:
 *
 *   { id, type, actor, source, amount, points, label, reason, ts }
 *
 * This shape is a superset of the engine's event shape
 * ({ id, type, actor, payload, ts } — see src/engine/engine.js `engine.log`),
 * so when the engine is wired to the app a `fromEngineEvent()` adapter can
 * feed engine.log into the same surface with no UI changes.
 *
 * Sovereignty utilities (docs/fcl-spec.md §4): the operator's data is
 * exportable (`downloadSnapshot`) and deletable (`deleteLocalData`) — the
 * notebook belongs to the operator.
 */

const APP_LABELS = {
    vestden: 'vestDen',
    conceptnexus: 'ConceptNexus',
    collaboard: 'CollaBoard',
    skillscanvas: 'SkillsCanvas',
    wallet: 'Wallet',
}

const appLabel = (app) => APP_LABELS[app] || 'Fixars'

const TXN_REASONS = {
    stake: 'Wallet debit recorded when a stake is placed',
    reward: 'Payout credited by an ecosystem reward rule',
    escrow: 'Escrow tranche released on milestone verification',
    topup: 'Wallet credit from a top-up',
}

export function normalizeWalletTxn(txn) {
    return {
        id: `wallet-${txn.id}`,
        type: txn.type,
        actor: 'you',
        source: 'wallet',
        amount: txn.amount,
        points: null,
        label: txn.label,
        reason: `${TXN_REASONS[txn.type] || 'Wallet movement'} · ${appLabel(txn.app)}`,
        ts: txn.date,
    }
}

export function normalizePointsRecord(record) {
    return {
        id: `points-${record.id}`,
        type: record.action,
        actor: 'you',
        source: 'points',
        amount: null,
        points: record.points,
        label: record.label,
        reason: `Points rule "${record.label}" (+${record.points} FixPoints)`,
        ts: record.timestamp,
    }
}

export function normalizeActivity(activity) {
    return {
        id: `activity-${activity.id}`,
        type: activity.type,
        actor: activity.user,
        source: 'activity',
        amount: null,
        points: null,
        label: `${activity.user} ${activity.message}`,
        reason: `${appLabel(activity.app)} activity event`,
        ts: activity.timestamp,
    }
}

// Reserved: fromEngineEvent(event) — adapter mapping an engine.log entry
// ({ id, type, actor, payload, ts }) into this ledger shape once the
// engine is wired to the app. See docs/fcl-spec.md §5.

/**
 * Merge the three histories into one ledger, newest first.
 */
export function buildLedger({ transactions = [], history = [], activities = [] }) {
    return [
        ...transactions.map(normalizeWalletTxn),
        ...history.map(normalizePointsRecord),
        ...activities.map(normalizeActivity),
    ].sort((a, b) => new Date(b.ts) - new Date(a.ts))
}

/**
 * A complete snapshot of the operator's local data — "your notebook".
 */
export function exportSnapshot({ user, balance, transactions, history, activities }) {
    return {
        pledge: 'Your data belongs to you. This snapshot is exportable, deletable, and never used to train anyone else’s models. — Fixars operational sovereignty (docs/fcl-spec.md §4)',
        exportedAt: new Date().toISOString(),
        profile: user ? { id: user.id, name: user.name, email: user.email, points: user.points, level: user.level } : null,
        wallet: { balance, transactions },
        pointsHistory: history,
        activities,
        ledger: buildLedger({ transactions, history, activities }),
    }
}

export function downloadSnapshot(snapshot) {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fixars-notebook-${snapshot.exportedAt.slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
}

// Explicit key list — never localStorage.clear(); theme/appearance
// preferences are the user's too and survive a data reset.
const LOCAL_DATA_KEYS = ['wallet_balance', 'wallet_txns']

export function deleteLocalData() {
    LOCAL_DATA_KEYS.forEach(key => localStorage.removeItem(key))
}
