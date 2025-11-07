"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BottomNav } from "@/components/bottom-nav"
import { BarChart3, Eye, Heart, TrendingUp, Users, MessageCircle, Award } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface DashboardStats {
  totalLikes: number
  totalComments: number
  totalImpressions: number
  totalPosts: number
  recentPosts: RecentPost[]
  weeklyGrowth: number
}

interface RecentPost {
  id: string
  title: string
  type: "ad" | "remix" | "survey"
  likes: number
  comments: number
  impressions: number
  createdAt: string
}

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalLikes: 0,
    totalComments: 0,
    totalImpressions: 0,
    totalPosts: 0,
    recentPosts: [],
    weeklyGrowth: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Fetch user's ads
      const { data: ads } = await supabase
        .from("ads")
        .select("id, title, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      // Fetch user's remixes
      const { data: remixes } = await supabase
        .from("remixes")
        .select("id, title, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      // Fetch user's surveys
      const { data: surveys } = await supabase
        .from("surveys")
        .select("id, title, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      const allContent = [
        ...(ads?.map((a) => ({ ...a, type: "ad" as const })) || []),
        ...(remixes?.map((r) => ({ ...r, type: "remix" as const })) || []),
        ...(surveys?.map((s) => ({ ...s, type: "survey" as const })) || []),
      ]

      // Calculate stats for each post
      const recentPostsData: RecentPost[] = await Promise.all(
        allContent.slice(0, 5).map(async (content) => {
          const { count: likesCount } = await supabase
            .from("likes")
            .select("*", { count: "exact", head: true })
            .eq("content_type", content.type)
            .eq("content_id", content.id)

          const { count: commentsCount } = await supabase
            .from("comments")
            .select("*", { count: "exact", head: true })
            .eq("content_type", content.type)
            .eq("content_id", content.id)

          // Calculate impressions (mock for now - would need a views table)
          const impressions = Math.floor(Math.random() * 1000) + 500

          return {
            id: content.id,
            title: content.title,
            type: content.type,
            likes: likesCount || 0,
            comments: commentsCount || 0,
            impressions,
            createdAt: content.created_at,
          }
        }),
      )

      // Calculate total stats
      const totalLikes = recentPostsData.reduce((sum, post) => sum + post.likes, 0)
      const totalComments = recentPostsData.reduce((sum, post) => sum + post.comments, 0)
      const totalImpressions = recentPostsData.reduce((sum, post) => sum + post.impressions, 0)

      // Mock weekly growth
      const weeklyGrowth = Math.floor(Math.random() * 30) + 10

      setStats({
        totalLikes,
        totalComments,
        totalImpressions,
        totalPosts: allContent.length,
        recentPosts: recentPostsData,
        weeklyGrowth,
      })

      setIsLoading(false)
    }

    loadDashboardData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div>読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-secondary p-6">
        <h1 className="text-2xl font-bold text-white font-display">ダッシュボード</h1>
        <p className="text-white/90 text-sm">あなたの活動統計</p>
      </div>

      {/* Main Stats Grid */}
      <div className="p-4 grid grid-cols-2 gap-3 -mt-6">
        <Card className="shadow-md bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-5 h-5 text-primary" />
              <span className="text-xs text-green-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />+{stats.weeklyGrowth}%
              </span>
            </div>
            <div className="text-2xl font-bold">{stats.totalImpressions.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">インプレッション</div>
          </CardContent>
        </Card>

        <Card className="shadow-md bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div className="text-2xl font-bold">{stats.totalLikes.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">獲得いいね数</div>
          </CardContent>
        </Card>

        <Card className="shadow-md bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div className="text-2xl font-bold">{stats.totalComments.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">コメント数</div>
          </CardContent>
        </Card>

        <Card className="shadow-md bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
            <div className="text-xs text-muted-foreground">総投稿数</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Posts Performance */}
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              最近の投稿パフォーマンス
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">まだ投稿がありません</p>
            ) : (
              stats.recentPosts.map((post) => (
                <div key={post.id} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm line-clamp-1">{post.title}</h3>
                      <span className="text-xs text-muted-foreground capitalize">
                        {post.type === "ad" ? "広告" : post.type === "remix" ? "Remix" : "アンケート"}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-muted-foreground" />
                      <span>{post.impressions.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-muted-foreground" />
                      <span>{post.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3 text-muted-foreground" />
                      <span>{post.comments}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Engagement Overview */}
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              エンゲージメント概要
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">平均エンゲージメント率</span>
                <span className="text-sm font-bold">
                  {stats.totalPosts > 0
                    ? (((stats.totalLikes + stats.totalComments) / stats.totalImpressions) * 100).toFixed(2)
                    : 0}
                  %
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">投稿あたりの平均いいね</span>
                <span className="text-sm font-bold">
                  {stats.totalPosts > 0 ? (stats.totalLikes / stats.totalPosts).toFixed(1) : 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">投稿あたりの平均コメント</span>
                <span className="text-sm font-bold">
                  {stats.totalPosts > 0 ? (stats.totalComments / stats.totalPosts).toFixed(1) : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav currentPage="dashboard" />
    </div>
  )
}
