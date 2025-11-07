"use client"

import { Home, Search, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  currentPage: "home" | "search" | "account"
}

export function BottomNav({ currentPage }: BottomNavProps) {
  const router = useRouter()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <nav className="flex items-center justify-around h-16 px-4 max-w-lg mx-auto">
        <button
          onClick={() => router.push("/home")}
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 transition-colors",
            currentPage === "home" ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Home className="w-6 h-6" fill={currentPage === "home" ? "currentColor" : "none"} />
          <span className="text-xs font-medium">ホーム</span>
        </button>

        <button
          onClick={() => router.push("/search")}
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 transition-colors",
            currentPage === "search" ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Search className="w-6 h-6" />
          <span className="text-xs font-medium">検索</span>
        </button>

        <button
          onClick={() => router.push("/account")}
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 transition-colors",
            currentPage === "account" ? "text-primary" : "text-muted-foreground",
          )}
        >
          <User className="w-6 h-6" fill={currentPage === "account" ? "currentColor" : "none"} />
          <span className="text-xs font-medium">アカウント</span>
        </button>
      </nav>
    </div>
  )
}
