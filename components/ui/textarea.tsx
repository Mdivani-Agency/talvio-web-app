import * as React from "react"

import { cn } from "@utils/tailwind"
import { ErrorBadge } from "./error-badge";

interface TextareaProps extends React.ComponentProps<"textarea"> {
  error?: string;
  size?: 'sm' | 'md' | 'lg';
}

function Textarea({ className, error, size = 'sm', ...props }: TextareaProps) {
  return (
    <div className="relative w-full">
    <textarea
      data-slot="textarea"
      className={cn(
        "bg-input text-foreground block h-16 w-full min-w-0 resize-none overflow-auto rounded-md border px-3 py-1.5 text-sm transition-[color,box-shadow] outline-none placeholder:text-placeholder selection:bg-primary selection:text-primary-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-md",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        size === 'sm' && 'h-16',
        size === 'md' && 'h-24',
        size === 'lg' && 'h-32',
        className
      )}
      {...props}
    />
    {error && <ErrorBadge error={error} className="absolute top-3 right-3" />}
    </div>
  )
}

export { Textarea }
