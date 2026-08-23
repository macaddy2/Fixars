import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground shadow-[0_18px_42px_rgba(36,87,230,.18)] hover:bg-primary/95 hover:shadow-[0_24px_58px_rgba(36,87,230,.24)] hover:-translate-y-0.5",
                destructive: "bg-destructive text-white shadow-md hover:bg-destructive/90",
                outline: "border border-border bg-white/80 text-primary hover:bg-blue-50",
                secondary: "bg-blue-50 text-foreground hover:bg-blue-100",
                ghost: "hover:bg-blue-50 hover:text-primary",
                link: "text-primary underline-offset-4 hover:underline",
                vestden: "bg-vestden text-white shadow-md hover:bg-vestden/90",
                conceptnexus: "bg-conceptnexus text-white shadow-md hover:bg-conceptnexus/90",
                collaboard: "bg-collaboard text-white shadow-md hover:bg-collaboard/90",
                skillscanvas: "bg-skillscanvas text-white shadow-md hover:bg-skillscanvas/90",
            },
            size: {
                default: "h-11 px-5 py-2",
                sm: "h-9 rounded-lg px-3 text-xs",
                lg: "h-12 rounded-2xl px-8 text-base",
                icon: "h-10 w-10 rounded-xl",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

const Button = React.forwardRef(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
