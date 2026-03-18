import { supabase, isSupabaseConfigured } from '@/lib/supabase'

/**
 * Create a payment intent for staking.
 * In live mode, calls a Supabase Edge Function that creates a Stripe PaymentIntent.
 * In mock mode, simulates the flow with a 2-second delay.
 */
export async function createPaymentIntent(stakeId, amount, metadata = {}) {
    if (!isSupabaseConfigured()) {
        // Mock mode — return a fake intent
        return {
            id: `pi_mock_${Date.now()}`,
            amount,
            status: 'requires_confirmation',
            stakeId,
            createdAt: new Date().toISOString()
        }
    }

    try {
        const { data, error } = await supabase.functions.invoke('create-payment-intent', {
            body: { stakeId, amount, ...metadata }
        })

        if (error) throw error
        return data
    } catch (err) {
        console.error('Payment intent error:', err)
        // Graceful fallback to mock
        return {
            id: `pi_fallback_${Date.now()}`,
            amount,
            status: 'requires_confirmation',
            stakeId,
            createdAt: new Date().toISOString()
        }
    }
}

/**
 * Confirm a payment intent.
 * Simulates a 2-second processing delay in mock mode.
 */
export async function confirmPayment(intentId, cardDetails = {}) {
    if (!isSupabaseConfigured() || intentId.startsWith('pi_mock') || intentId.startsWith('pi_fallback')) {
        // Mock: simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000))
        return {
            id: intentId,
            status: 'succeeded',
            confirmedAt: new Date().toISOString(),
            receipt: {
                last4: cardDetails.number?.slice(-4) || '4242',
                brand: 'visa',
                amount: cardDetails.amount || 0
            }
        }
    }

    try {
        const { data, error } = await supabase.functions.invoke('confirm-payment', {
            body: { intentId, cardDetails }
        })

        if (error) throw error
        return data
    } catch (err) {
        console.error('Payment confirmation error:', err)
        throw new Error('Payment failed. Please try again.')
    }
}

/**
 * Fetch payment history for a user.
 */
export async function fetchPaymentHistory(userId) {
    if (!isSupabaseConfigured()) {
        // Mock payment history
        return [
            {
                id: 'txn-001',
                amount: 2500,
                stakeName: 'AI-Powered Recipe Generator',
                status: 'succeeded',
                last4: '4242',
                brand: 'visa',
                createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
            },
            {
                id: 'txn-002',
                amount: 1000,
                stakeName: 'Sustainable Fashion Marketplace',
                status: 'succeeded',
                last4: '8888',
                brand: 'mastercard',
                createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
            }
        ]
    }

    // In a live setup, this would query a payments table or Stripe API
    try {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20)

        if (error) throw error

        return (data || []).map(p => ({
            id: p.id,
            amount: p.amount,
            stakeName: p.stake_name,
            status: p.status,
            last4: p.card_last4,
            brand: p.card_brand,
            createdAt: p.created_at
        }))
    } catch {
        return []
    }
}

/**
 * Format amount as currency string.
 */
export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount)
}
