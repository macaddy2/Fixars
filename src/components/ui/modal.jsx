import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

/**
 * Accessible modal shell (Radix Dialog under the hood).
 * - Focus is trapped inside and restored on close
 * - Esc / backdrop click close via Radix
 * - Body scroll locked by Radix while open
 */
export default function Modal({ open, onClose, title, subtitle, gradient = 'gradient-primary', children, maxWidth = 'max-w-lg' }) {
    return (
        <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose?.() }}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm animate-fade-in" />
                <Dialog.Content
                    aria-describedby={undefined}
                    className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center focus:outline-none"
                >
                    {/* Bottom-sheet on mobile, centered card on sm+ (v2 modal chrome) */}
                    <div className={`relative w-full ${maxWidth} sm:mx-4 animate-slide-in-up`}>
                        <Card className="shadow-2xl overflow-hidden rounded-b-none rounded-t-2xl sm:rounded-xl max-h-[90vh] sm:max-h-[85vh] flex flex-col">
                            <div className={`h-[3px] flex-shrink-0 ${gradient}`} />
                            <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-2 flex-shrink-0">
                                <div>
                                    <Dialog.Title className="text-lg font-bold text-foreground">
                                        {title || 'Dialog'}
                                    </Dialog.Title>
                                    {subtitle && (
                                        <Dialog.Description className="text-sm text-muted mt-1">
                                            {subtitle}
                                        </Dialog.Description>
                                    )}
                                </div>
                                <Dialog.Close
                                    aria-label="Close"
                                    className="p-1 hover:bg-muted/10 rounded-md"
                                >
                                    <X className="w-5 h-5 text-muted" />
                                </Dialog.Close>
                            </div>
                            <CardContent className="pt-2 pb-6 overflow-y-auto">
                                {children}
                            </CardContent>
                        </Card>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
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
