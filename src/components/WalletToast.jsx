import { useWallet } from '@/contexts/WalletContext'
import { Check } from 'lucide-react'

/**
 * Navy pill toast (v2) — surfaces simulated wallet/stake actions.
 * Bottom-centered, auto-dismissed by the WalletContext after ~2.6s.
 */
export default function WalletToast() {
    const { toast } = useWallet()
    if (!toast) return null

    return (
        <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] animate-slide-in-up"
            role="status"
            aria-live="polite"
        >
            <div
                className="flex items-center gap-2.5 px-4 py-3 rounded-full text-white text-[13px] font-medium shadow-xl"
                style={{ background: 'var(--color-navy-900)' }}
            >
                <span
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--color-success)' }}
                >
                    <Check className="w-3 h-3" strokeWidth={3} />
                </span>
                {toast.message}
            </div>
        </div>
    )
}
