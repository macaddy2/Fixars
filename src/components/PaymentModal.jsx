import { useState, useEffect, useCallback } from 'react'
import { X, CreditCard, Check, Lock, Loader2, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createPaymentIntent, confirmPayment, formatCurrency } from '@/lib/payments'
import { cn } from '@/lib/utils'

export default function PaymentModal({ isOpen, onClose, stake, amount, onSuccess }) {
    const [step, setStep] = useState('form') // form | processing | success
    const [cardNumber, setCardNumber] = useState('')
    const [expiry, setExpiry] = useState('')
    const [cvc, setCvc] = useState('')
    const [cardName, setCardName] = useState('')
    const [error, setError] = useState(null)
    const [receipt, setReceipt] = useState(null)

    useEffect(() => {
        if (isOpen) {
            setStep('form')
            setCardNumber('')
            setExpiry('')
            setCvc('')
            setCardName('')
            setError(null)
            setReceipt(null)
        }
    }, [isOpen])

    // Auto-format card number with spaces
    const handleCardNumber = (value) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 16)
        const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim()
        setCardNumber(formatted)
    }

    // Auto-format expiry as MM/YY
    const handleExpiry = (value) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 4)
        if (cleaned.length >= 2) {
            setExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`)
        } else {
            setExpiry(cleaned)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)

        // Basic validation
        const cardDigits = cardNumber.replace(/\s/g, '')
        if (cardDigits.length < 16) {
            setError('Please enter a valid card number')
            return
        }
        if (expiry.length < 5) {
            setError('Please enter a valid expiry date')
            return
        }
        if (cvc.length < 3) {
            setError('Please enter a valid CVC')
            return
        }

        try {
            setStep('processing')

            // Create intent
            const intent = await createPaymentIntent(stake?.id, amount)

            // Confirm payment
            const result = await confirmPayment(intent.id, {
                number: cardDigits,
                expiry,
                cvc,
                amount
            })

            setReceipt(result.receipt)
            setStep('success')

            // Notify parent after short delay
            setTimeout(() => {
                onSuccess?.(result)
            }, 500)
        } catch (err) {
            setError(err.message || 'Payment failed. Please try again.')
            setStep('form')
        }
    }

    const getCardBrand = () => {
        const num = cardNumber.replace(/\s/g, '')
        if (num.startsWith('4')) return 'visa'
        if (num.startsWith('5') || num.startsWith('2')) return 'mastercard'
        if (num.startsWith('3')) return 'amex'
        return null
    }

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
                onClick={step === 'form' ? onClose : undefined}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border animate-slide-in-up overflow-hidden">

                    {/* Header */}
                    <div className="gradient-primary p-6 text-white relative">
                        {step === 'form' && (
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">
                                    {step === 'success' ? 'Payment Complete!' : 'Secure Payment'}
                                </h2>
                                <p className="text-sm text-white/80">
                                    {step === 'success' ? 'Transaction confirmed' : 'Your investment is protected'}
                                </p>
                            </div>
                        </div>

                        {/* Amount display */}
                        <div className="flex items-baseline gap-2 mt-4">
                            <span className="text-4xl font-bold">{formatCurrency(amount)}</span>
                            <span className="text-white/70 text-sm">USD</span>
                        </div>
                        {stake && (
                            <p className="text-sm text-white/70 mt-1 truncate">→ {stake.title}</p>
                        )}
                    </div>

                    {/* Form Step */}
                    {step === 'form' && (
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Card Number */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Card Number</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={cardNumber}
                                        onChange={(e) => handleCardNumber(e.target.value)}
                                        placeholder="1234 5678 9012 3456"
                                        className="w-full px-4 py-3 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-lg tracking-wider"
                                        autoComplete="cc-number"
                                    />
                                    {getCardBrand() && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <Badge variant="outline" className="text-xs uppercase font-bold">
                                                {getCardBrand()}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Cardholder Name */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Cardholder Name</label>
                                <input
                                    type="text"
                                    value={cardName}
                                    onChange={(e) => setCardName(e.target.value)}
                                    placeholder="John Doe"
                                    className="w-full px-4 py-3 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    autoComplete="cc-name"
                                />
                            </div>

                            {/* Expiry + CVC */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Expiry</label>
                                    <input
                                        type="text"
                                        value={expiry}
                                        onChange={(e) => handleExpiry(e.target.value)}
                                        placeholder="MM/YY"
                                        className="w-full px-4 py-3 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                                        autoComplete="cc-exp"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">CVC</label>
                                    <input
                                        type="text"
                                        value={cvc}
                                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        placeholder="123"
                                        className="w-full px-4 py-3 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                                        autoComplete="cc-csc"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                    {error}
                                </div>
                            )}

                            <Button type="submit" className="w-full h-12 text-base font-semibold gradient-primary text-white rounded-xl hover:opacity-90 transition-opacity">
                                <Lock className="w-4 h-4 mr-2" />
                                Pay {formatCurrency(amount)}
                            </Button>

                            <div className="flex items-center justify-center gap-2 text-xs text-muted">
                                <Shield className="w-3 h-3" />
                                <span>Secured with 256-bit SSL encryption</span>
                            </div>
                        </form>
                    )}

                    {/* Processing Step */}
                    {step === 'processing' && (
                        <div className="p-12 flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center animate-pulse">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                            <p className="text-lg font-semibold text-foreground">Processing Payment...</p>
                            <p className="text-sm text-muted">Please don't close this window</p>
                        </div>
                    )}

                    {/* Success Step */}
                    {step === 'success' && (
                        <div className="p-8 flex flex-col items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center animate-payment-success">
                                <Check className="w-10 h-10 text-success" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground">Investment Confirmed!</h3>
                            <p className="text-muted text-center text-sm">
                                Your {formatCurrency(amount)} stake on <strong>{stake?.title}</strong> has been processed successfully.
                            </p>

                            {receipt && (
                                <div className="w-full p-4 rounded-xl bg-muted/5 border text-sm space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-muted">Card</span>
                                        <span className="font-mono text-foreground">•••• {receipt.last4}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted">Amount</span>
                                        <span className="font-semibold text-foreground">{formatCurrency(amount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted">Status</span>
                                        <Badge variant="default" className="bg-success text-white">Confirmed</Badge>
                                    </div>
                                </div>
                            )}

                            <Button onClick={onClose} className="w-full mt-2">
                                Done
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
