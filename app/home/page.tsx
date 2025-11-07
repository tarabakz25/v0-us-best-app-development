"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2 } from "lucide-react"
import { ProductSheet } from "@/components/product-sheet"
import { BottomNav } from "@/components/bottom-nav"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface ContentItem {
  id: string
  type: "ad" | "remix" | "survey"
  title: string
  description: string
  brand?: string
  mediaUrl: string
  likes: number
  comments: number
  shopUrl?: string
  reviews?: Array<{ user: string; rating: number; text: string }>
  isLiked?: boolean
}

export default function HomePage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState<ContentItem | null>(null)
  const [content, setContent] = useState<ContentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isScrolling = useRef(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadContent() {
      setIsLoading(true)

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      // Fetch ads, remixes, and surveys
      const [adsResult, remixesResult, surveysResult] = await Promise.all([
        supabase.from("ads").select("*").order("created_at", { ascending: false }),
        supabase.from("remixes").select("*").order("created_at", { ascending: false }),
        supabase.from("surveys").select("*").order("created_at", { ascending: false }),
      ])

      // Fetch likes count for each content
      const allContent: ContentItem[] = []

      // Process ads
      if (adsResult.data) {
        for (const ad of adsResult.data) {
          const { count: likesCount } = await supabase
            .from("likes")
            .select("*", { count: "exact", head: true })
            .eq("content_type", "ad")
            .eq("content_id", ad.id)

          const { count: commentsCount } = await supabase
            .from("comments")
            .select("*", { count: "exact", head: true })
            .eq("content_type", "ad")
            .eq("content_id", ad.id)

          let isLiked = false
          if (user) {
            const { data: likeData } = await supabase
              .from("likes")
              .select("*")
              .eq("user_id", user.id)
              .eq("content_type", "ad")
              .eq("content_id", ad.id)
              .single()
            isLiked = !!likeData
          }

          allContent.push({
            id: ad.id,
            type: "ad",
            title: ad.title,
            description: ad.description,
            brand: ad.brand || undefined,
            mediaUrl: ad.media_url,
            shopUrl: ad.shop_url || undefined,
            likes: likesCount || 0,
            comments: commentsCount || 0,
            isLiked,
          })
        }
      }

      // Process remixes
      if (remixesResult.data) {
        for (const remix of remixesResult.data) {
          const { count: likesCount } = await supabase
            .from("likes")
            .select("*", { count: "exact", head: true })
            .eq("content_type", "remix")
            .eq("content_id", remix.id)

          const { count: commentsCount } = await supabase
            .from("comments")
            .select("*", { count: "exact", head: true })
            .eq("content_type", "remix")
            .eq("content_id", remix.id)

          let isLiked = false
          if (user) {
            const { data: likeData } = await supabase
              .from("likes")
              .select("*")
              .eq("user_id", user.id)
              .eq("content_type", "remix")
              .eq("content_id", remix.id)
              .single()
            isLiked = !!likeData
          }

          allContent.push({
            id: remix.id,
            type: "remix",
            title: remix.title,
            description: remix.description,
            mediaUrl: remix.media_url,
            likes: likesCount || 0,
            comments: commentsCount || 0,
            isLiked,
          })
        }
      }

      // Process surveys
      if (surveysResult.data) {
        for (const survey of surveysResult.data) {
          const { count: likesCount } = await supabase
            .from("likes")
            .select("*", { count: "exact", head: true })
            .eq("content_type", "survey")
            .eq("content_id", survey.id)

          const { count: commentsCount } = await supabase
            .from("comments")
            .select("*", { count: "exact", head: true })
            .eq("content_type", "survey")
            .eq("content_id", survey.id)

          let isLiked = false
          if (user) {
            const { data: likeData } = await supabase
              .from("likes")
              .select("*")
              .eq("user_id", user.id)
              .eq("content_type", "survey")
              .eq("content_id", survey.id)
              .single()
            isLiked = !!likeData
          }

          allContent.push({
            id: survey.id,
            type: "survey",
            title: survey.title,
            description: survey.description,
            brand: survey.brand || undefined,
            mediaUrl: survey.media_url || "/placeholder.svg?height=800&width=600",
            likes: likesCount || 0,
            comments: commentsCount || 0,
            isLiked,
          })
        }
      }

      setContent(allContent)
      setIsLoading(false)
    }

    loadContent()
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      if (isScrolling.current) return

      const scrollTop = container.scrollTop
      const itemHeight = container.clientHeight
      const newIndex = Math.round(scrollTop / itemHeight)

      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < content.length) {
        setCurrentIndex(newIndex)
      }
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [currentIndex, content.length])

  const handleLike = async (item: ContentItem) => {
    if (!userId) {
      router.push("/auth/login")
      return
    }

    const isLiked = item.isLiked

    if (isLiked) {
      // Unlike
      await supabase
        .from("likes")
        .delete()
        .eq("user_id", userId)
        .eq("content_type", item.type)
        .eq("content_id", item.id)

      setContent((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, likes: Math.max(0, c.likes - 1), isLiked: false } : c)),
      )
    } else {
      // Like
      await supabase.from("likes").insert({
        user_id: userId,
        content_type: item.type,
        content_id: item.id,
      })

      setContent((prev) => prev.map((c) => (c.id === item.id ? { ...c, likes: c.likes + 1, isLiked: true } : c)))
    }
  }

  const handleProductClick = (item: ContentItem) => {
    if (item.type === "ad") {
      setSelectedProduct(item)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-white">読み込み中...</div>
      </div>
    )
  }

  if (content.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white px-6">
        <h2 className="text-2xl font-bold mb-4">コンテンツがありません</h2>
        <p className="text-center text-white/70 mb-6">まだ投稿がありません。最初の投稿者になりましょう!</p>
        <Button onClick={() => router.push("/post")}>投稿する</Button>
        <BottomNav currentPage="home" />
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      <div ref={containerRef} className="h-full w-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar">
        {content.map((item) => (
          <div key={item.id} className="h-screen w-full snap-start relative flex items-center justify-center">
            <img
              src={item.mediaUrl || "/placeholder.svg"}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

            {/* Content Overlay */}
            <div className="absolute bottom-24 left-0 right-0 px-6 text-white space-y-3">
              {item.brand && <div className="text-sm font-medium opacity-90">{item.brand}</div>}
              <h2 className="text-2xl font-bold text-balance">{item.title}</h2>
              <p className="text-sm opacity-90 text-pretty">{item.description}</p>

              {item.type === "ad" && (
                <Button
                  onClick={() => handleProductClick(item)}
                  className="bg-white text-foreground hover:bg-white/90 mt-4"
                >
                  詳細を見る
                </Button>
              )}

              {item.type === "survey" && (
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4">
                  アンケートに答える
                </Button>
              )}
            </div>

            {/* Right Side Actions */}
            <div className="absolute right-4 bottom-32 flex flex-col gap-6">
              <button className="flex flex-col items-center gap-1" onClick={() => handleLike(item)}>
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Heart className={`w-6 h-6 ${item.isLiked ? "fill-primary text-primary" : "text-white"}`} />
                </div>
                <span className="text-white text-xs font-medium">{item.likes}</span>
              </button>

              <button className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-medium">{item.comments}</span>
              </button>

              <button className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>

      <BottomNav currentPage="home" />

      {selectedProduct && (
        <ProductSheet
          product={selectedProduct}
          open={!!selectedProduct}
          onOpenChange={(open) => !open && setSelectedProduct(null)}
        />
      )}
    </div>
  )
}
