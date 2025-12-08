import * as React from "react"

import { cn } from "@/lib/utils"

interface SeparatorProps extends React.ComponentPropsWithoutRef<"div"> {
  orientation?: 'horizontal' | 'vertical'
}

const Separator = React.forwardRef<
  HTMLDivElement,
  SeparatorProps
>(({ className, orientation = 'horizontal', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "shrinkable-0 bg-border",
      orientation === 'horizontal' ? "h-[1px] w-full" : "w-[1px] h-full",
      className
    )}
    {...props}
  />
))
Separator.displayName = "Separator"

export { Separator }