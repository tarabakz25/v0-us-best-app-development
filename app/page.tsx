"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

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
      <div className="">
        <Image src="/logo.svg" alt="UsBest Logo" width={200} height={200} className="drop-shadow-2xl" priority />
      </div>
    </div>
  )
}
