import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default: "bg-primary/10 text-primary",
                secondary: "bg-muted/30 text-muted",
                success: "bg-success/10 text-success",
                warning: "bg-warning/10 text-warning",
                destructive: "bg-destructive/10 text-destructive",
                outline: "border border-current bg-transparent",
                vestden: "bg-vestden/10 text-vestden",
                conceptnexus: "bg-conceptnexus/10 text-conceptnexus",
                collaboard: "bg-collaboard/10 text-collaboard",
                skillscanvas: "bg-skillscanvas/10 text-skillscanvas",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

function Badge({ className, variant, ...props }) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
