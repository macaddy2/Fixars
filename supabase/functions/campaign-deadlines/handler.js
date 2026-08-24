const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type, x-scheduler-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const JSON_HEADERS = { ...CORS_HEADERS, 'Content-Type': 'application/json' }

function json(body, status) {
    return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS })
}

async function secretsMatch(provided, expected, cryptoImpl) {
    if (!provided || !expected) return false

    const encoder = new TextEncoder()
    const [providedHash, expectedHash] = await Promise.all([
        cryptoImpl.subtle.digest('SHA-256', encoder.encode(provided)),
        cryptoImpl.subtle.digest('SHA-256', encoder.encode(expected)),
    ])

    const left = new Uint8Array(providedHash)
    const right = new Uint8Array(expectedHash)
    let difference = 0
    for (let i = 0; i < left.length; i += 1) difference |= left[i] ^ right[i]
    return difference === 0
}

export function createCampaignDeadlinesHandler({
    getEnv,
    createAdmin,
    cryptoImpl = globalThis.crypto,
    logger = console,
}) {
    return async function campaignDeadlines(req) {
        if (req.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: CORS_HEADERS })
        }
        if (req.method !== 'POST') {
            return new Response(null, {
                status: 405,
                headers: { ...CORS_HEADERS, Allow: 'POST, OPTIONS' },
            })
        }

        try {
            const authorized = await secretsMatch(
                req.headers.get('x-scheduler-secret'),
                getEnv('SCHEDULER_SECRET'),
                cryptoImpl,
            )
            if (!authorized) return json({ error: 'unauthorized' }, 401)

            const supabaseUrl = getEnv('SUPABASE_URL')
            const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')
            if (!supabaseUrl || !serviceKey) {
                logger.error('campaign-deadlines is missing required server configuration')
                return json({ error: 'service unavailable' }, 503)
            }

            const admin = createAdmin(supabaseUrl, serviceKey)
            const { data, error } = await admin.rpc('close_expired_campaigns')
            if (error) {
                logger.error('close_expired_campaigns failed:', error.message)
                return json({ error: 'deadline sweep failed' }, 500)
            }

            return json({ closed: data ?? 0 }, 200)
        } catch (error) {
            logger.error('campaign-deadlines error:', error)
            return json({ error: 'unexpected error' }, 500)
        }
    }
}
