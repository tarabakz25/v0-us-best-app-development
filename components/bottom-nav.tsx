"use client"

import { Home, Search, User, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  currentPage: "home" | "search" | "account" | "dashboard"
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
          onClick={() => router.push("/dashboard")}
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 transition-colors",
            currentPage === "dashboard" ? "text-primary" : "text-muted-foreground",
          )}
        >
          <BarChart3 className="w-6 h-6" />
          <span className="text-xs font-medium">統計</span>
        </button>

        <button onClick={() => router.push("/post")} className="flex items-center justify-center -mt-6">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-7 h-7"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
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
