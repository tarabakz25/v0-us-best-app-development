"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function LoadingPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => {
      router.push("/home")
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary via-secondary to-primary flex items-center justify-center">
      <div className="animate-pulse">
        <div className="w-32 h-32 bg-white rounded-3xl flex items-center justify-center shadow-2xl">
          <span className="text-5xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
            UB
          </span>
        </div>
      </div>
    </div>
  )
}
