import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'

import {
  parseNairaAmount,
  selectCallbackOrigin,
  validatedPaystackTransaction,
  verifyPaystackSignature,
} from '../../supabase/functions/_shared/paystack.js'

test('converts only positive amounts with at most two decimal places to kobo', () => {
  assert.deepEqual(parseNairaAmount('1250.50'), { naira: 1250.5, subunit: 125050 })
  assert.equal(parseNairaAmount('1.001'), null)
  assert.equal(parseNairaAmount('-1'), null)
  assert.equal(parseNairaAmount('not-a-number'), null)
})

test('accepts only exact configured callback origins', () => {
  const allowed = 'https://fixars.example, http://localhost:5173'
  assert.equal(selectCallbackOrigin('https://fixars.example', null, allowed), 'https://fixars.example')
  assert.equal(selectCallbackOrigin('https://evil.example', null, allowed), null)
  assert.equal(selectCallbackOrigin('https://fixars.example/redirect', null, allowed), null)
})

test('verifies Paystack HMAC-SHA512 over the exact raw request body', async () => {
  const secret = 'test-secret'
  const rawBody = new TextEncoder().encode('{"event":"charge.success"}')
  const signature = createHmac('sha512', secret).update(rawBody).digest('hex')
  assert.equal(await verifyPaystackSignature(rawBody, signature, secret), true)
  assert.equal(await verifyPaystackSignature(new TextEncoder().encode('{}'), signature, secret), false)
})

test('requires exact successful reference, amount, and currency', () => {
  const expected = { reference: 'fixars-1', amountSubunit: 125050, currency: 'NGN' }
  const tx = { status: 'success', reference: 'fixars-1', amount: 125050, currency: 'NGN' }
  assert.equal(validatedPaystackTransaction(tx, expected), true)
  assert.equal(validatedPaystackTransaction({ ...tx, amount: 1 }, expected), false)
  assert.equal(validatedPaystackTransaction({ ...tx, currency: 'USD' }, expected), false)
  assert.equal(validatedPaystackTransaction({ ...tx, reference: 'other' }, expected), false)
})
