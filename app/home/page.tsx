"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2 } from "lucide-react"
import { ProductSheet } from "@/components/product-sheet"
import { SurveySheet } from "@/components/survey-sheet"
import { BottomNav } from "@/components/bottom-nav"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { LoadingScreen } from "@/components/loading-screen"

interface SurveyQuestion {
  question: string
  options: string[]
}

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
  questions?: SurveyQuestion[]
}

export default function HomePage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState<ContentItem | null>(null)
  const [content, setContent] = useState<ContentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [activeSurvey, setActiveSurvey] = useState<ContentItem | null>(null)
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string>>({})
  const [isSurveySubmitting, setIsSurveySubmitting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isScrolling = useRef(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    async function loadContent() {
      setIsLoading(true)

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUserId(user?.id || null)

        const likedContentKeys = new Set<string>()
        if (user) {
          const { data: likedRows, error: likedError } = await supabase
            .from("likes")
            .select("content_type, content_id")
            .eq("user_id", user.id)

          if (likedError) {
            console.error("Error fetching liked content:", likedError)
          } else {
            likedRows?.forEach((row) => likedContentKeys.add(`${row.content_type}:${row.content_id}`))
          }
        }

        const [adsResult, remixesResult, surveysResult] = await Promise.all([
          supabase.from("ads").select("*").order("created_at", { ascending: false }),
          supabase.from("remixes").select("*").order("created_at", { ascending: false }),
          supabase.from("surveys").select("*").order("created_at", { ascending: false }),
        ])

        if (adsResult.error) console.error("Error fetching ads:", adsResult.error)
        if (remixesResult.error) console.error("Error fetching remixes:", remixesResult.error)
        if (surveysResult.error) console.error("Error fetching surveys:", surveysResult.error)

        const getEngagementCounts = async (contentType: ContentItem["type"], contentId: string) => {
          const [likesResult, commentsResult] = await Promise.all([
            supabase
              .from("likes")
              .select("*", { count: "exact", head: true })
              .eq("content_type", contentType)
              .eq("content_id", contentId),
            supabase
              .from("comments")
              .select("*", { count: "exact", head: true })
              .eq("content_type", contentType)
              .eq("content_id", contentId),
          ])

          if (likesResult.error) console.error("Error fetching likes count:", likesResult.error)
          if (commentsResult.error) console.error("Error fetching comments count:", commentsResult.error)

          return {
            likes: likesResult.count || 0,
            comments: commentsResult.count || 0,
          }
        }

        const adsContent = adsResult.data
          ? await Promise.all(
              adsResult.data.map(async (ad) => {
                const { likes, comments } = await getEngagementCounts("ad", ad.id)
                return {
                  id: ad.id,
                  type: "ad" as const,
                  title: ad.title,
                  description: ad.description,
                  brand: ad.brand || undefined,
                  mediaUrl: ad.media_url,
                  shopUrl: ad.shop_url || undefined,
                  likes,
                  comments,
                  isLiked: likedContentKeys.has(`ad:${ad.id}`),
                }
              }),
            )
          : []

        const remixesContent = remixesResult.data
          ? await Promise.all(
              remixesResult.data.map(async (remix) => {
                const { likes, comments } = await getEngagementCounts("remix", remix.id)
                return {
                  id: remix.id,
                  type: "remix" as const,
                  title: remix.title,
                  description: remix.description,
                  mediaUrl: remix.media_url,
                  likes,
                  comments,
                  isLiked: likedContentKeys.has(`remix:${remix.id}`),
                }
              }),
            )
          : []

        const surveysContent = surveysResult.data
          ? await Promise.all(
              surveysResult.data.map(async (survey) => {
                const { likes, comments } = await getEngagementCounts("survey", survey.id)
                return {
                  id: survey.id,
                  type: "survey" as const,
                  title: survey.title,
                  description: survey.description,
                  brand: survey.brand || undefined,
                  mediaUrl: survey.media_url || "/placeholder.svg?height=800&width=600",
                  likes,
                  comments,
                  questions: Array.isArray(survey.questions) ? survey.questions : [],
                  isLiked: likedContentKeys.has(`survey:${survey.id}`),
                }
              }),
            )
          : []

        setContent([...adsContent, ...remixesContent, ...surveysContent])
      } catch (error) {
        console.error("Error loading content:", error)
        toast({
          title: "エラー",
          description: "コンテンツの取得に失敗しました。",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
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

    const isLiked = content.find((c) => c.id === item.id)?.isLiked

    try {
      if (isLiked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("user_id", userId)
          .eq("content_type", item.type)
          .eq("content_id", item.id)

        if (error) throw error

        setContent((prev) =>
          prev.map((c) => (c.id === item.id ? { ...c, likes: Math.max(0, c.likes - 1), isLiked: false } : c)),
        )
      } else {
        const { error } = await supabase
          .from("likes")
          .upsert(
            {
              user_id: userId,
              content_type: item.type,
              content_id: item.id,
            },
            { onConflict: "user_id,content_type,content_id", ignoreDuplicates: true },
          )

        if (error) throw error

        setContent((prev) => prev.map((c) => (c.id === item.id ? { ...c, likes: c.likes + 1, isLiked: true } : c)))
      }
    } catch (error) {
      console.error("Error toggling like:", error)
      toast({
        title: "エラー",
        description: "いいねの更新に失敗しました。",
        variant: "destructive",
      })
    }
  }

  const handleProductClick = (item: ContentItem) => {
    if (item.type === "ad") {
      setSelectedProduct(item)
    }
  }

  const handleSurveyButtonClick = async (item: ContentItem) => {
    if (!item.questions || item.questions.length === 0) {
      toast({
        title: "回答できません",
        description: "このアンケートには質問が設定されていません。",
        variant: "destructive",
      })
      return
    }

    if (!userId) {
      router.push("/auth/login")
      return
    }

    setActiveSurvey(item)
    setSurveyAnswers({})

    try {
      const { data, error } = await supabase
        .from("survey_responses")
        .select("answers")
        .eq("survey_id", item.id)
        .eq("user_id", userId)
        .maybeSingle()

      if (error) throw error

      if (data?.answers && Array.isArray(data.answers)) {
        const restoredAnswers = (data.answers as Array<{ question?: string; answer?: string }>).reduce(
          (acc, entry) => {
            if (entry.question && entry.answer) {
              acc[entry.question] = entry.answer
            }
            return acc
          },
          {} as Record<string, string>,
        )

        setSurveyAnswers(restoredAnswers)
      }
    } catch (error) {
      console.error("Error fetching existing survey response:", error)
    }
  }

  const handleSurveyAnswerSelect = (question: string, option: string) => {
    setSurveyAnswers((prev) => ({ ...prev, [question]: option }))
  }

  const handleSurveySubmit = async () => {
    if (!activeSurvey) return

    if (!userId) {
      router.push("/auth/login")
      return
    }

    if (!activeSurvey.questions || activeSurvey.questions.length === 0) {
      toast({
        title: "回答できません",
        description: "このアンケートには質問がありません。",
        variant: "destructive",
      })
      return
    }

    const unanswered = activeSurvey.questions.filter((q) => !surveyAnswers[q.question])
    if (unanswered.length > 0) {
      toast({
        title: "未回答の質問があります",
        description: "すべての質問に回答してください。",
        variant: "destructive",
      })
      return
    }

    setIsSurveySubmitting(true)

    try {
      const answersPayload = activeSurvey.questions.map((q) => ({
        question: q.question,
        answer: surveyAnswers[q.question],
      }))

      const { error } = await supabase
        .from("survey_responses")
        .upsert(
          {
            user_id: userId,
            survey_id: activeSurvey.id,
            answers: answersPayload,
          },
          { onConflict: "survey_id,user_id" },
        )

      if (error) throw error

      toast({
        title: "送信が完了しました",
        description: "ご協力ありがとうございます。",
      })

      setActiveSurvey(null)
      setSurveyAnswers({})
    } catch (error) {
      console.error("Error submitting survey response:", error)
      toast({
        title: "送信に失敗しました",
        description: "時間を置いて再度お試しください。",
        variant: "destructive",
      })
    } finally {
      setIsSurveySubmitting(false)
    }
  }

  if (isLoading) {
    return <LoadingScreen message="フィードを読み込み中..." subtext="あなた向けのコンテンツを取得しています" />
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
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4"
                  onClick={() => handleSurveyButtonClick(item)}
                >
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

      {activeSurvey && (
        <SurveySheet
          survey={activeSurvey}
          open={!!activeSurvey}
          onOpenChange={(open) => {
            if (!open) {
              setActiveSurvey(null)
              setSurveyAnswers({})
            }
          }}
          selectedOptions={surveyAnswers}
          onSelectOption={handleSurveyAnswerSelect}
          onSubmit={handleSurveySubmit}
          isSubmitting={isSurveySubmitting}
        />
      )}
    </div>
  )
}
