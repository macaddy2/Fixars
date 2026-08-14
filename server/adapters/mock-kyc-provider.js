/**
 * Mock KycProvider. Does not call NIMC, NIBSS, Smile Identity, or any network.
 */
export function createMockKycProvider() {
    const statuses = new Map()

    return {
        async getStatus(userId) {
            if (!userId) throw new Error('userId is required')
            return statuses.get(userId) || {
                userId,
                status: 'unverified',
                provider: 'mock',
                liveNetwork: false,
                note: 'Mock adapter only. No identity-network call.',
            }
        },

        async startVerification(userId) {
            if (!userId) throw new Error('userId is required')
            const record = {
                userId,
                status: 'pending_mock',
                provider: 'mock',
                liveNetwork: false,
                note: 'Mock verification started. No NIMC / NIBSS / Smile call was made.',
            }
            statuses.set(userId, record)
            return { ...record }
        },
    }
}
