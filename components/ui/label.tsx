"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@utils/tailwind"

export interface LabelProps extends React.ComponentProps<typeof LabelPrimitive.Root> {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "muted";
}

function Label({
  className,
  size = "md",
  variant = "default",
  ...props
}: LabelProps) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-md leading-none font-semibold select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        size === "sm" && "text-sm",
        size === "md" && "text-md",
        size === "lg" && "text-xl",
        variant === "muted" && "text-muted-foreground font-medium uppercase",
        className
      )}
      {...props}
    />
  )
}

export { Label }
