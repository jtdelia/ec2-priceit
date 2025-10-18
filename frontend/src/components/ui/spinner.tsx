import * as React from "react"

import { cn } from "@/lib/utils"

export const Spinner = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary",
          className
        )}
        {...props}
      />
    )
  }
)

Spinner.displayName = "Spinner"