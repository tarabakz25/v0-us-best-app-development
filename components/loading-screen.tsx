import { Loader2 } from "lucide-react"

interface LoadingScreenProps {
  message?: string
  subtext?: string
}

export function LoadingScreen({
  message = "読み込み中...",
  subtext = "しばらくお待ちください",
}: LoadingScreenProps) {
  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-black via-gray-950 to-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.4),_transparent_60%)] opacity-70 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(244,114,182,0.3),_transparent_50%)] opacity-50 blur-3xl" />
      <div className="relative flex flex-col items-center gap-4 px-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <div>
          <p className="text-xl font-semibold">{message}</p>
          <p className="text-sm text-white/70 mt-1">{subtext}</p>
        </div>
      </div>
    </div>
  )
}
