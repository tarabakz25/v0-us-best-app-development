"use client"

import type React from "react"
import { useEffect, useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { BottomNav } from "@/components/bottom-nav"
import { ChevronRight, BarChart3, Settings, Bell, HelpCircle, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { LoadingScreen } from "@/components/loading-screen"

interface UserProfile {
  id: string
  display_name: string
  avatar_url?: string
  bio?: string
}

export default function AccountPage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user data from Supabase
  useEffect(() => {
    async function loadUserData() {
      setIsLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Fetch profile
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (profileData) {
        setProfile(profileData)
      }

      setIsLoading(false)
    }

    loadUserData()
  }, [])

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  if (isLoading) {
    return <LoadingScreen message="プロフィールを読み込み中..." subtext="少々お待ちください" />
  }

  const displayName = profile?.display_name || "ユーザー"
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-primary to-secondary p-6 pb-12">
        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
            <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
            <AvatarFallback className="text-2xl bg-white text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{displayName}</h1>
            {profile?.bio && <p className="text-white/90 text-sm">{profile.bio}</p>}
          </div>
          <Button variant="ghost" size="icon" className="text-white">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 space-y-2 mt-4">
        <MenuItem icon={<BarChart3 />} label="ダッシュボード" onClick={() => router.push("/dashboard")} />
        <MenuItem icon={<Bell />} label="通知設定" onClick={() => {}} />
        <MenuItem icon={<HelpCircle />} label="ヘルプ・お問い合わせ" onClick={() => {}} />
        <MenuItem icon={<LogOut />} label="ログアウト" onClick={handleLogout} />
      </div>

      <BottomNav currentPage="account" />
    </div>
  )
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 bg-card rounded-xl hover:bg-muted/50 transition-colors"
    >
      <div className="text-muted-foreground">{icon}</div>
      <span className="flex-1 text-left font-medium">{label}</span>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </button>
  )
}
