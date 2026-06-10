import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

/**
 * Accessible modal shell.
 * - Click backdrop or Esc to close
 * - Focus is trapped by browser default (dialog-like). For stronger a11y
 *   swap to @radix-ui/react-dialog, which is already installed.
 */
export default function Modal({ open, onClose, title, subtitle, gradient = 'gradient-primary', children, maxWidth = 'max-w-lg' }) {
    useEffect(() => {
        if (!open) return
        const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
        document.addEventListener('keydown', onKey)
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = prev
        }
    }, [open, onClose])

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
            role="dialog" aria-modal="true" aria-label={title}
        >
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />
            {/* Bottom-sheet on mobile, centered card on sm+ (v2 modal chrome) */}
            <div className={`relative w-full ${maxWidth} sm:mx-4 animate-slide-in-up`}>
                <Card className="shadow-2xl overflow-hidden rounded-b-none rounded-t-2xl sm:rounded-xl max-h-[90vh] sm:max-h-[85vh] flex flex-col">
                    <div className={`h-[3px] flex-shrink-0 ${gradient}`} />
                    <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-2 flex-shrink-0">
                        <div>
                            <h2 className="text-lg font-bold text-foreground">{title}</h2>
                            {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
                        </div>
                        <button
                            onClick={onClose}
                            aria-label="Close"
                            className="p-1 hover:bg-muted/10 rounded-md"
                        >
                            <X className="w-5 h-5 text-muted" />
                        </button>
                    </div>
                    <CardContent className="pt-2 pb-6 overflow-y-auto">
                        {children}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export function Field({ label, required, hint, children }) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground block">
                {label}{required && <span className="text-destructive ml-0.5">*</span>}
            </label>
            {children}
            {hint && <p className="text-xs text-muted">{hint}</p>}
        </div>
    )
}
