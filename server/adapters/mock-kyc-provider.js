/**
 * Mock KycProvider — NIN (NIMC) and BVN interface.
 * Does not call NIMC, NIBSS, Smile Identity, Dojah, or any network.
 * liveNetwork is always false. Prototype / planned / not live.
 */
function mockStatus(userId, extra = {}) {
    return {
        userId,
        status: extra.status || 'unverified',
        channel: extra.channel || null,
        provider: 'mock',
        liveNetwork: false,
        note: extra.note || 'Mock adapter only. Prototype NIN/BVN port. Planned. Not live.',
    }
}

export function createMockKycProvider() {
    const statuses = new Map()

    return {
        async getStatus(userId) {
            if (!userId) throw new Error('userId is required')
            return statuses.get(userId) || mockStatus(userId)
        },

        async startVerification(userId) {
            if (!userId) throw new Error('userId is required')
            const record = mockStatus(userId, {
                status: 'pending_mock',
                note: 'Prototype verification started. Planned. Not live. No identity-network call.',
            })
            statuses.set(userId, record)
            return { ...record }
        },

        async verifyNin(userId) {
            if (!userId) throw new Error('userId is required')
            const record = mockStatus(userId, {
                status: 'prototype_unverified',
                channel: 'nin',
                note: 'Prototype NIN adapter. Planned. Not live. No identity-network call.',
            })
            statuses.set(userId, record)
            return { ...record }
        },

        async verifyBvn(userId) {
            if (!userId) throw new Error('userId is required')
            const record = mockStatus(userId, {
                status: 'prototype_unverified',
                channel: 'bvn',
                note: 'Prototype BVN adapter. Planned. Not live. No identity-network call.',
            })
            statuses.set(userId, record)
            return { ...record }
        },
    }
}
