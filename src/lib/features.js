/**
 * Product flags for the sandbox-facing Fixars build.
 *
 * VestDen as a product includes a naira wallet and invest-in-ideas / staking.
 * The CBN cohort live test is naira wallet / holding customer naira (MMO) only.
 * Staking is disclosed as a product, out of that test, intended SEC parallel.
 * If admitted, the staking UI stays gated.
 *
 * DEFAULT OFF: the staking surface stays hidden unless an operator explicitly
 * sets VITE_VESTDEN_STAKING=1 on a named internal preview. Never set it on the
 * public demo / GitHub Pages build. Do not treat dummy wallet balances as a
 * live-money path. Enabling this flag does NOT create custody or rails — the
 * underlying ledger tier is still whatever VITE_REAL_SESSION selects.
 */
export function isVestDenStakingEnabled() {
    const value = import.meta.env.VITE_VESTDEN_STAKING
    return value === '1' || value === 'true'
}

/**
 * Ledger rows that solicit staking or VestDen returns/IRR.
 * Sandbox filter must drop these — not only type === 'stake'.
 * Covers VestDen earnings such as "Returns from Solar Grid Network".
 */
export function isVestDenStakingLedgerRow(txn) {
    if (!txn) return false
    if (txn.type === 'stake') return true
    if (txn.app === 'vestden') return true
    return false
}
