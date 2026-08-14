/**
 * Product flags for the sandbox-facing Fixars build.
 *
 * VestDen as a product includes a naira wallet and invest-in-ideas / staking.
 * The CBN cohort live test is naira wallet / holding customer naira (MMO) only.
 * Staking is disclosed as a product, out of that test, intended SEC parallel.
 * If admitted, the staking UI stays gated.
 *
 * Hard-off for the build we would show. Do not flip this to solicit staking.
 * Do not treat dummy wallet balances as a live-money path.
 * Do not unhibernate Supabase or invent a payment rail to "test" staking.
 */
export function isVestDenStakingEnabled() {
    return false
}
