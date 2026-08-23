import { useEffect, useState } from 'react'
import { EyeOff } from 'lucide-react'

/**
 * ScreenShield — deterrence layer against casual capture.
 *
 * Honest scope: OS-level screenshots can never be blocked by a web app.
 * This raises the friction bar for opportunistic capture:
 *   - Blanks the UI whenever the window loses focus or the tab hides
 *     (kills Alt+Tab / window-picker previews)
 *   - Clears the clipboard when PrintScreen is pressed
 *   - A print stylesheet (index.css) renders nothing on Ctrl/Cmd+P
 */
export default function ScreenShield() {
    const [shielded, setShielded] = useState(false)

    useEffect(() => {
        const onBlur = () => setShielded(true)
        const onFocus = () => setShielded(false)
        const onVisibility = () => setShielded(document.hidden)

        const onPrintScreen = async (e) => {
            if (e.key === 'PrintScreen' || e.keyCode === 44) {
                setShielded(true)
                // Best-effort clipboard wipe; may throw without permission
                try { await navigator.clipboard.writeText('') } catch { /* ignore */ }
                setTimeout(() => setShielded(false), 1200)
            }
        }

        window.addEventListener('blur', onBlur)
        window.addEventListener('focus', onFocus)
        document.addEventListener('visibilitychange', onVisibility)
        document.addEventListener('keyup', onPrintScreen)

        return () => {
            window.removeEventListener('blur', onBlur)
            window.removeEventListener('focus', onFocus)
            document.removeEventListener('visibilitychange', onVisibility)
            document.removeEventListener('keyup', onPrintScreen)
        }
    }, [])

    if (!shielded) return null

    return (
        <div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-3 bg-background/95 backdrop-blur-xl"
            aria-hidden="true"
        >
            <EyeOff className="w-10 h-10 text-muted" />
            <p className="text-sm font-medium text-muted">Content hidden while this window is inactive</p>
        </div>
    )
}
