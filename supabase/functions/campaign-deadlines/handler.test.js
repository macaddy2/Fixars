import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'
import { createCampaignDeadlinesHandler } from './handler.js'

const ENV = {
    SCHEDULER_SECRET: 'a-long-random-scheduler-secret',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'server-only-key',
}

function setup({ env = ENV, rpcResult = { data: 2, error: null } } = {}) {
    const rpc = mock.fn(async () => rpcResult)
    const createAdmin = mock.fn(() => ({ rpc }))
    const logger = { error: mock.fn() }
    const handler = createCampaignDeadlinesHandler({
        getEnv: (name) => env[name],
        createAdmin,
        logger,
    })
    return { handler, createAdmin, rpc, logger }
}

describe('campaign-deadlines handler', () => {
    it('answers preflight without invoking the database', async () => {
        const { handler, createAdmin } = setup()
        const response = await handler(new Request('https://example.test', { method: 'OPTIONS' }))
        assert.equal(response.status, 204)
        assert.match(response.headers.get('access-control-allow-headers'), /x-scheduler-secret/)
        assert.equal(createAdmin.mock.callCount(), 0)
    })

    it('rejects non-POST methods', async () => {
        const { handler, createAdmin } = setup()
        const response = await handler(new Request('https://example.test'))
        assert.equal(response.status, 405)
        assert.equal(response.headers.get('allow'), 'POST, OPTIONS')
        assert.equal(createAdmin.mock.callCount(), 0)
    })

    for (const secret of [undefined, 'wrong-secret']) {
        it(`rejects a ${secret ? 'wrong' : 'missing'} secret`, async () => {
            const { handler, createAdmin } = setup()
            const headers = secret ? { 'x-scheduler-secret': secret } : undefined
            const response = await handler(new Request('https://example.test', { method: 'POST', headers }))
            assert.equal(response.status, 401)
            assert.deepEqual(await response.json(), { error: 'unauthorized' })
            assert.equal(createAdmin.mock.callCount(), 0)
        })
    }

    it('runs the sweep for the scheduler without exposing server credentials', async () => {
        const { handler, createAdmin, rpc } = setup()
        const response = await handler(new Request('https://example.test', {
            method: 'POST',
            headers: { 'x-scheduler-secret': ENV.SCHEDULER_SECRET },
        }))
        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { closed: 2 })
        assert.deepEqual(createAdmin.mock.calls[0].arguments, [ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY])
        assert.deepEqual(rpc.mock.calls[0].arguments, ['close_expired_campaigns'])
    })

    it('returns a safe error when the RPC fails', async () => {
        const { handler, logger } = setup({ rpcResult: { data: null, error: { message: 'database detail' } } })
        const response = await handler(new Request('https://example.test', {
            method: 'POST',
            headers: { 'x-scheduler-secret': ENV.SCHEDULER_SECRET },
        }))
        assert.equal(response.status, 500)
        assert.deepEqual(await response.json(), { error: 'deadline sweep failed' })
        assert.deepEqual(logger.error.mock.calls[0].arguments, ['close_expired_campaigns failed:', 'database detail'])
    })

    it('fails closed when server configuration is incomplete', async () => {
        const { handler, createAdmin } = setup({ env: { SCHEDULER_SECRET: ENV.SCHEDULER_SECRET } })
        const response = await handler(new Request('https://example.test', {
            method: 'POST',
            headers: { 'x-scheduler-secret': ENV.SCHEDULER_SECRET },
        }))
        assert.equal(response.status, 503)
        assert.deepEqual(await response.json(), { error: 'service unavailable' })
        assert.equal(createAdmin.mock.callCount(), 0)
    })
})
