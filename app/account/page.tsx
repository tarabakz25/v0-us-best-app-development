"use client"

import type React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BottomNav } from "@/components/bottom-nav"
import { ChevronRight, Heart, MessageCircle, Award, Settings, Bell, HelpCircle, LogOut, Gift } from "lucide-react"

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-primary to-secondary p-6 pb-12">
        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
            <AvatarImage src="/placeholder.svg?height=80&width=80" />
            <AvatarFallback className="text-2xl bg-white text-primary">YU</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">ユーザー名</h1>
            <p className="text-white/90 text-sm">user@example.com</p>
          </div>
          <Button variant="ghost" size="icon" className="text-white">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 -mt-8 grid grid-cols-3 gap-3 mb-6">
        <Card className="shadow-md">
          <CardContent className="p-4 text-center">
            <Heart className="w-6 h-6 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">234</div>
            <div className="text-xs text-muted-foreground">いいね</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-4 text-center">
            <MessageCircle className="w-6 h-6 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">89</div>
            <div className="text-xs text-muted-foreground">コメント</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-4 text-center">
            <Award className="w-6 h-6 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">12</div>
            <div className="text-xs text-muted-foreground">獲得報酬</div>
          </CardContent>
        </Card>
      </div>

      {/* Contribution History */}
      <div className="px-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">貢献履歴</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Gift className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">UGC動画が採用されました</p>
                <p className="text-xs text-muted-foreground">TechSound ワイヤレスイヤホン</p>
              </div>
              <span className="text-xs text-primary font-medium">報酬獲得</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">コメントが採用されました</p>
                <p className="text-xs text-muted-foreground">GreenLife エコ水筒</p>
              </div>
              <span className="text-xs text-primary font-medium">報酬獲得</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Items */}
      <div className="px-4 space-y-2">
        <MenuItem icon={<Bell />} label="通知設定" />
        <MenuItem icon={<Gift />} label="獲得した報酬" />
        <MenuItem icon={<Heart />} label="いいねした広告" />
        <MenuItem icon={<HelpCircle />} label="ヘルプ・お問い合わせ" />
        <MenuItem icon={<LogOut />} label="ログアウト" />
      </div>

      <BottomNav currentPage="account" />
    </div>
  )
}

function MenuItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="w-full flex items-center gap-3 p-4 bg-card rounded-xl hover:bg-muted/50 transition-colors">
      <div className="text-muted-foreground">{icon}</div>
      <span className="flex-1 text-left font-medium">{label}</span>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </button>
  )
}
