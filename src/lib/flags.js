/**
 * Product flags.
 *
 * VITE_REAL_SESSION must be unset on the public GitHub Pages build so the
 * static demo path stays the dummy. Railway / internal preview may set
 * VITE_REAL_SESSION=1 together with server REAL_SESSION=1.
 *
 * isSupabaseConfigured() stays hard-false. Do not treat this flag as
 * enabling live custody, Paystack, NIMC, or Supabase-as-prod.
 */
export function isRealSessionEnabled() {
    const value = import.meta.env.VITE_REAL_SESSION
    return value === '1' || value === 'true'
}
