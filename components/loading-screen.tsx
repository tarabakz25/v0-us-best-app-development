import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

interface LoadingScreenProps {
  className?: string
  message?: string
  subtext?: string
}

export function LoadingScreen({ className, message, subtext }: LoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-[240px] w-full flex-1 flex-col items-center justify-center gap-3 py-12 text-center",
        className,
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/60">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">{message ?? "読み込み中"}</span>
      </div>
      {(message || subtext) && (
        <div className="space-y-1">
          {message && <p className="text-sm font-semibold text-foreground">{message}</p>}
          {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
        </div>
      )}
    </div>
  )
}
