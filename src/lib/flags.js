/**
 * Product flags.
 *
 * VITE_REAL_SESSION stays unset by default so a GitHub Pages build is the
 * dummy demo. Do not set it on the Pages workflow. Only a named internal
 * preview may turn it on, together with server REAL_SESSION=1.
 *
 * isSupabaseConfigured() stays hard-false. Do not treat this flag as
 * enabling live custody, Paystack, NIMC, or Supabase-as-prod.
 */
export function isRealSessionEnabled() {
    const value = import.meta.env.VITE_REAL_SESSION
    return value === '1' || value === 'true'
}

/**
 * NIN/BVN (NIMC) adapter surface. Default off on Pages.
 * Even when on, the server mock sets liveNetwork: false.
 */
export function isKycPortEnabled() {
    const value = import.meta.env.VITE_KYC_PORT
    return value === '1' || value === 'true'
}
