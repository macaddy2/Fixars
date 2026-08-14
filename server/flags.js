function on(value) {
    return value === '1' || value === 'true'
}

/** Server session stack. Default off so Pages stays the dummy demo. */
export function isRealSessionFlag(env = process.env) {
    return on(env.REAL_SESSION)
}

/**
 * NIN/BVN (NIMC) adapter surface. Default off.
 * Does not enable a live identity network even when on — mock only.
 */
export function isKycPortFlag(env = process.env) {
    return on(env.KYC_PORT)
}
