"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Star } from "lucide-react"

import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { LoadingScreen } from "@/components/loading-screen"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  createEmptySurveyResults,
  transformSurveyResults,
  type SurveyResultRow,
  type SurveyResultsState,
} from "@/lib/survey-results"

type ContentType = "ad" | "remix" | "survey"

interface SurveyQuestion {
  question: string
  options: string[]
}

interface Review {
  id: string
  user: string
  userId: string
  rating: number
  text: string
  createdAt: string
}

interface BaseDetail {
  id: string
  title: string
  description: string
  brand?: string
  mediaUrl: string
}

interface AdDetail extends BaseDetail {
  type: "ad"
  shopUrl?: string
  reviews: Review[]
}

interface RemixDetail extends BaseDetail {
  type: "remix"
  remixParentTitle?: string
}

interface SurveyDetail extends BaseDetail {
  type: "survey"
  questions: SurveyQuestion[]
}

type ContentDetail = AdDetail | RemixDetail | SurveyDetail

const typeLabelMap: Record<ContentType, string> = {
  ad: "広告",
  remix: "Remix",
  survey: "アンケート",
}

const ratingSteps = [1, 2, 3, 4, 5] as const

const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

export default function SearchDetailPage() {
  const params = useParams<{ contentType: string; contentId: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])

  const contentType = params?.contentType
  const contentId = params?.contentId
  const isValidContentType = contentType === "ad" || contentType === "remix" || contentType === "survey"

  const [detail, setDetail] = useState<ContentDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [userDisplayName, setUserDisplayName] = useState("")
  const [reviewForm, setReviewForm] = useState({ rating: 5, text: "" })
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false)

  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string>>({})
  const [hasSubmittedSurvey, setHasSubmittedSurvey] = useState(false)
  const [isSurveySubmitting, setIsSurveySubmitting] = useState(false)
  const [surveyResults, setSurveyResults] = useState<SurveyResultsState>(() => createEmptySurveyResults())
  const [isSurveyResultsLoading, setIsSurveyResultsLoading] = useState(false)

  const averageRating = useMemo(() => {
    if (!detail || detail.type !== "ad" || detail.reviews.length === 0) {
      return null
    }
    const total = detail.reviews.reduce((sum, review) => sum + review.rating, 0)
    return (total / detail.reviews.length).toFixed(1)
  }, [detail])

  const aggregateSurveyResultsFallback = useCallback(
    async (surveyId: string): Promise<SurveyResultsState> => {
      const { data, error } = await supabase.from("survey_responses").select("answers").eq("survey_id", surveyId)

      if (error) throw error
      if (!data || data.length === 0) {
        return createEmptySurveyResults()
      }

      const counts: Record<string, Record<string, number>> = {}

      data.forEach((response) => {
        const answers = Array.isArray(response.answers) ? response.answers : []
        answers.forEach((entry: any) => {
          const question = typeof entry?.question === "string" ? entry.question.trim() : ""
          const option = typeof entry?.answer === "string" ? entry.answer.trim() : ""
          if (!question || !option) return
          if (!counts[question]) {
            counts[question] = {}
          }
          counts[question][option] = (counts[question][option] || 0) + 1
        })
      })

      const rows: SurveyResultRow[] = Object.entries(counts).flatMap(([question, options]) =>
        Object.entries(options).map(([option, count]) => ({
          question,
          option,
          vote_count: count,
          total_votes: data.length,
        })),
      )

      if (rows.length === 0) {
        const empty = createEmptySurveyResults()
        return {
          ...empty,
          totalResponses: data.length,
        }
      }

      return transformSurveyResults(rows)
    },
    [supabase],
  )

  const fetchSurveyResults = useCallback(
    async (surveyId: string): Promise<SurveyResultsState | null> => {
      setIsSurveyResultsLoading(true)

      const useFallback = async (reason?: unknown) => {
        if (reason) {
          console.warn("Falling back to client-side survey aggregation", reason)
        }
        try {
          return await aggregateSurveyResultsFallback(surveyId)
        } catch (fallbackError) {
          console.error("Error aggregating survey results without RPC:", fallbackError)
          toast({
            title: "集計の取得に失敗しました",
            description: "時間を置いて再度お試しください。",
            variant: "destructive",
          })
          return null
        }
      }

      try {
        const { data, error } = await supabase.rpc("get_survey_results", {
          p_survey_id: surveyId,
        })

        if (error) {
          return await useFallback(error)
        }

        const rows = (data as SurveyResultRow[]) || []
        if (rows.length === 0) {
          return await useFallback()
        }

        return transformSurveyResults(rows)
      } catch (fetchError) {
        return await useFallback(fetchError)
      } finally {
        setIsSurveyResultsLoading(false)
      }
    },
    [aggregateSurveyResultsFallback, supabase, toast],
  )

  useEffect(() => {
    let isActive = true

    async function loadDetail() {
      if (!contentId || !isValidContentType) {
        setError("コンテンツが見つかりませんでした。")
        setDetail(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        if (contentType === "ad") {
          const { data: ad, error: adError } = await supabase.from("ads").select("*").eq("id", contentId).single()
          if (adError || !ad) {
            throw adError || new Error("ad not found")
          }

          const { data: reviewsData, error: reviewsError } = await supabase
            .from("reviews")
            .select("id, rating, text, created_at, user_id, profiles(display_name)")
            .eq("ad_id", contentId)
            .order("created_at", { ascending: false })

          if (reviewsError) {
            throw reviewsError
          }

          const normalizedReviews: Review[] =
            (reviewsData || []).map((review: any) => ({
              id: review.id,
              rating: review.rating,
              text: review.text,
              createdAt: review.created_at,
              userId: review.user_id,
              user: review.profiles?.display_name || "ユーザー",
            })) ?? []

          if (!isActive) return

          setDetail({
            id: ad.id,
            type: "ad",
            title: ad.title,
            description: ad.description,
            brand: ad.brand || undefined,
            mediaUrl: ad.media_url || "/placeholder.svg?height=800&width=600",
            shopUrl: ad.shop_url || undefined,
            reviews: normalizedReviews,
          })
        } else if (contentType === "remix") {
          const { data: remix, error: remixError } = await supabase.from("remixes").select("*").eq("id", contentId).single()

          if (remixError || !remix) {
            throw remixError || new Error("remix not found")
          }

          let remixParentTitle: string | undefined
          let remixBrand: string | undefined

          if (remix.ad_id) {
            const { data: parentAd } = await supabase.from("ads").select("title, brand").eq("id", remix.ad_id).maybeSingle()
            remixParentTitle = parentAd?.title || undefined
            remixBrand = parentAd?.brand || undefined
          }

          if (!isActive) return

          setDetail({
            id: remix.id,
            type: "remix",
            title: remix.title,
            description: remix.description,
            mediaUrl: remix.media_url || "/placeholder.svg?height=800&width=600",
            brand: remixBrand,
            remixParentTitle,
          })
        } else {
          const { data: survey, error: surveyError } = await supabase.from("surveys").select("*").eq("id", contentId).single()

          if (surveyError || !survey) {
            throw surveyError || new Error("survey not found")
          }

          const questionList: SurveyQuestion[] = Array.isArray(survey.questions)
            ? survey.questions
                .map((question: any) => ({
                  question: question?.question?.trim() || "",
                  options: Array.isArray(question?.options)
                    ? (question.options as Array<string | null>)
                        .filter((option): option is string => typeof option === "string" && option.trim().length > 0)
                        .map((option) => option.trim())
                    : [],
                }))
                .filter((question: SurveyQuestion) => question.question.length > 0)
            : []

          if (!isActive) return

          setDetail({
            id: survey.id,
            type: "survey",
            title: survey.title,
            description: survey.description,
            brand: survey.brand || undefined,
            mediaUrl: survey.media_url || "/placeholder.svg?height=800&width=600",
            questions: questionList,
          })
        }
      } catch (loadError) {
        console.error("Error loading detail:", loadError)
        if (!isActive) return
        setDetail(null)
        setError("詳細情報の取得に失敗しました。")
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    loadDetail()

    return () => {
      isActive = false
    }
  }, [contentId, contentType, isValidContentType, supabase])

  useEffect(() => {
    let isMounted = true

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!isMounted) return

      setUserId(user?.id ?? null)

      if (user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle()

        if (!isMounted) return
        setUserDisplayName(profile?.display_name || "あなた")
      } else {
        setUserDisplayName("")
      }
    }

    loadUser()

    return () => {
      isMounted = false
    }
  }, [supabase])

  useEffect(() => {
    setSurveyAnswers({})
    setHasSubmittedSurvey(false)
    setSurveyResults(createEmptySurveyResults())
  }, [detail?.id, detail?.type])

  useEffect(() => {
    if (!detail || detail.type !== "survey" || !userId) return

    let isActive = true

    async function loadExistingResponse() {
      try {
        const { data, error } = await supabase
          .from("survey_responses")
          .select("answers")
          .eq("survey_id", detail.id)
          .eq("user_id", userId)
          .maybeSingle()

        if (error) throw error
        if (!isActive) return

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
          setHasSubmittedSurvey(true)

          const results = await fetchSurveyResults(detail.id)
          if (!isActive || !results) return
          setSurveyResults(results)
        }
      } catch (existingError) {
        console.error("Error fetching existing survey response:", existingError)
      }
    }

    loadExistingResponse()

    return () => {
      isActive = false
    }
  }, [detail, fetchSurveyResults, supabase, userId])

  const handleSurveyAnswerSelect = (question: string, option: string) => {
    setSurveyAnswers((prev) => ({ ...prev, [question]: option }))
  }

  const handleSurveySubmit = async () => {
    if (!detail || detail.type !== "survey") return

    if (!userId) {
      router.push("/auth/login")
      return
    }

    const unanswered = detail.questions.filter((q) => !surveyAnswers[q.question])
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
      const answersPayload = detail.questions.map((question) => ({
        question: question.question,
        answer: surveyAnswers[question.question],
      }))

      const { error } = await supabase
        .from("survey_responses")
        .upsert(
          {
            user_id: userId,
            survey_id: detail.id,
            answers: answersPayload,
          },
          { onConflict: "survey_id,user_id" },
        )

      if (error) throw error

      toast({
        title: "送信が完了しました",
        description: "ご協力ありがとうございます。",
      })

      setHasSubmittedSurvey(true)

      const results = await fetchSurveyResults(detail.id)
      if (results) {
        setSurveyResults(results)
      }
    } catch (submitError) {
      console.error("Error submitting survey:", submitError)
      toast({
        title: "送信に失敗しました",
        description: "時間を置いて再度お試しください。",
        variant: "destructive",
      })
    } finally {
      setIsSurveySubmitting(false)
    }
  }

  const handleReviewSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!detail || detail.type !== "ad") return

    if (!userId) {
      router.push("/auth/login")
      return
    }

    if (!reviewForm.text.trim()) {
      toast({
        title: "口コミ内容を入力してください",
        description: "感じたことを一言でもOKです。",
        variant: "destructive",
      })
      return
    }

    if (detail.reviews.some((review) => review.userId === userId)) {
      toast({
        title: "すでに口コミを投稿済みです",
        description: "現在は1件のみ投稿できます。",
      })
      return
    }

    setIsReviewSubmitting(true)

    try {
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          user_id: userId,
          ad_id: detail.id,
          rating: reviewForm.rating,
          text: reviewForm.text.trim(),
        })
        .select("id, rating, text, created_at, user_id, profiles(display_name)")
        .single()

      if (error) throw error

      const nextReview: Review = {
        id: data.id,
        rating: data.rating,
        text: data.text,
        createdAt: data.created_at,
        userId: data.user_id,
        user: data.profiles?.display_name || userDisplayName || "あなた",
      }

      setDetail((prev) => {
        if (!prev || prev.type !== "ad") return prev
        return {
          ...prev,
          reviews: [nextReview, ...prev.reviews],
        }
      })

      setReviewForm({ rating: 5, text: "" })

      toast({
        title: "口コミを投稿しました",
        description: "貴重なご意見をありがとうございます。",
      })
    } catch (reviewError) {
      console.error("Error submitting review:", reviewError)
      toast({
        title: "投稿に失敗しました",
        description: "時間を置いて再度お試しください。",
        variant: "destructive",
      })
    } finally {
      setIsReviewSubmitting(false)
    }
  }

  if (isLoading) {
    return <LoadingScreen message="詳細を読み込み中..." subtext="おすすめを準備しています" />
  }

  if (error || !detail) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
        <div className="space-y-2">
          <p className="text-lg font-semibold">ページを表示できませんでした</p>
          <p className="text-sm text-muted-foreground">{error || "コンテンツを取得できませんでした。"}</p>
        </div>
        <Button onClick={() => router.push("/search")}>検索に戻る</Button>
      </div>
    )
  }

  const heroImage = detail.mediaUrl || "/placeholder.svg?height=800&width=600"
  const surveyQuestions = detail.type === "survey" ? detail.questions : []
  const allSurveyQuestionsAnswered =
    detail.type !== "survey" || surveyQuestions.every((question) => surveyAnswers[question.question])

  return (
    <div className="bg-background pb-24 text-foreground">
      <div className="relative h-[320px] w-full">
        <img src={heroImage} alt={detail.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-background" />
        <button
          onClick={() => router.back()}
          className="absolute left-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="-mt-16 space-y-8 rounded-t-3xl bg-background px-5 pb-8 pt-6 shadow-lg">
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold text-primary">
            {typeLabelMap[detail.type]}
          </div>
          <div className="space-y-2">
            {detail.brand && <p className="text-sm font-medium text-primary">{detail.brand}</p>}
            <h1 className="text-2xl font-bold leading-tight text-balance">{detail.title}</h1>
            <p className="text-sm text-muted-foreground text-pretty">{detail.description}</p>
            {detail.type === "remix" && detail.remixParentTitle && (
              <p className="text-xs text-muted-foreground">
                元の広告: <span className="font-medium text-foreground">{detail.remixParentTitle}</span>
              </p>
            )}
          </div>

          {detail.type === "ad" && (
            <div className="flex items-center gap-6 rounded-2xl border border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" fill="currentColor" />
                <div>
                  <p className="text-lg font-bold leading-none">{averageRating ?? "ー"}</p>
                  <p className="text-xs text-muted-foreground">
                    {detail.reviews.length > 0 ? `${detail.reviews.length}件の口コミ` : "まだ口コミはありません"}
                  </p>
                </div>
              </div>
              {detail.shopUrl && (
                <Button asChild className="ml-auto">
                  <a href={detail.shopUrl} target="_blank" rel="noopener noreferrer">
                    ショップで見る
                  </a>
                </Button>
              )}
            </div>
          )}

          {detail.type === "survey" && (
            <div className="flex items-center gap-6 rounded-2xl border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">質問数</p>
                <p className="text-lg font-bold">{surveyQuestions.length}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">回答数</p>
                <p className="text-lg font-bold">
                  {surveyResults.totalResponses > 0 ? `${surveyResults.totalResponses}件` : "回答を募集中"}
                </p>
              </div>
            </div>
          )}
        </div>

        {detail.type === "survey" && (
          <section className="space-y-6 rounded-3xl border border-border bg-card/40 px-5 py-6">
            <div>
              <h2 className="text-lg font-semibold">アンケートに参加する</h2>
              <p className="text-sm text-muted-foreground">
                {hasSubmittedSurvey ? "あなたの回答と結果をご確認ください。" : "気軽に選択して投票できます。"}
              </p>
            </div>

            {surveyQuestions.length === 0 ? (
              <p className="rounded-2xl bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
                このアンケートにはまだ質問が設定されていません。
              </p>
            ) : hasSubmittedSurvey ? (
              <div className="space-y-6">
                {surveyQuestions.map((question, index) => {
                  const questionResult = surveyResults.questionResults[question.question] || {
                    totalVotes: surveyResults.totalResponses,
                    options: {},
                  }
                  const totalVotesForQuestion = questionResult.totalVotes || surveyResults.totalResponses

                  return (
                    <div key={`${question.question}-${index}`} className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold">
                          {index + 1}. {question.question}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {totalVotesForQuestion > 0 ? `${totalVotesForQuestion}件の投票` : "まだ投票がありません"}
                        </p>
                      </div>
                      <div className="space-y-3">
                        {question.options.map((option, idx) => {
                          const votes = questionResult.options[option] || 0
                          const percentage = totalVotesForQuestion > 0 ? Math.round((votes / totalVotesForQuestion) * 100) : 0
                          const isUserChoice = surveyAnswers[question.question] === option

                          return (
                            <div key={`${option}-${idx}`} className="space-y-1">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className={isUserChoice ? "font-semibold text-foreground" : ""}>{option}</span>
                                <span>
                                  {votes}票 ({percentage}%)
                                </span>
                              </div>
                              <div className="relative h-3 rounded-full bg-muted">
                                <div
                                  className={cn(
                                    "absolute inset-y-0 left-0 rounded-full transition-all",
                                    isUserChoice ? "bg-primary" : "bg-primary/40",
                                  )}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                  <span>ご協力ありがとうございました。</span>
                  {isSurveyResultsLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {surveyQuestions.map((question, index) => (
                  <div key={`${question.question}-${index}`} className="space-y-3">
                    <p className="text-sm font-semibold">
                      {index + 1}. {question.question}
                    </p>
                    <div className="grid gap-2">
                      {question.options.map((option, idx) => {
                        const isSelected = surveyAnswers[question.question] === option
                        return (
                          <Button
                            key={`${option}-${idx}`}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            className={cn(
                              "justify-start text-left",
                              isSelected ? "" : "bg-transparent text-foreground",
                            )}
                            onClick={() => handleSurveyAnswerSelect(question.question, option)}
                          >
                            {option}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!hasSubmittedSurvey && surveyQuestions.length > 0 && (
              <Button className="w-full" onClick={handleSurveySubmit} disabled={isSurveySubmitting || !allSurveyQuestionsAnswered}>
                {isSurveySubmitting ? "送信中..." : "この内容で投票する"}
              </Button>
            )}
          </section>
        )}

        {detail.type === "ad" && (
          <section className="space-y-6 rounded-3xl border border-border bg-card/40 px-5 py-6">
            <div>
              <h2 className="text-lg font-semibold">口コミ</h2>
              <p className="text-sm text-muted-foreground">実際に見た/使ったユーザーの声をチェック</p>
            </div>

            <div className="space-y-4">
              {detail.reviews.length === 0 ? (
                <p className="rounded-2xl bg-muted/30 px-4 py-6 text-sm text-muted-foreground">まだ口コミはありません。</p>
              ) : (
                detail.reviews.map((review) => (
                  <div
                    key={review.id}
                    className={cn(
                      "rounded-2xl border border-border/60 px-4 py-3 shadow-sm",
                      review.userId === userId ? "border-primary/40 bg-primary/5" : "",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{review.user}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {ratingSteps.map((step) => (
                          <Star
                            key={step}
                            className={cn("h-4 w-4", step <= review.rating ? "text-primary" : "text-muted-foreground")}
                            fill={step <= review.rating ? "currentColor" : "none"}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-foreground">{review.text}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 rounded-2xl border border-dashed border-border/70 px-4 py-5">
              <div>
                <p className="text-sm font-semibold">あなたの評価</p>
                <div className="mt-2 flex items-center gap-2">
                  {ratingSteps.map((step) => {
                    const isActive = reviewForm.rating >= step
                    return (
                      <button
                        type="button"
                        key={step}
                        className={cn(
                          "inline-flex h-10 w-10 items-center justify-center rounded-full border transition",
                          isActive ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
                        )}
                        onClick={() => setReviewForm((prev) => ({ ...prev, rating: step }))}
                      >
                        <Star className="h-5 w-5" fill={isActive ? "currentColor" : "none"} />
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">コメント</p>
                <Textarea
                  placeholder="使ってみた感想やおすすめポイントを教えてください"
                  value={reviewForm.text}
                  onChange={(event) => setReviewForm((prev) => ({ ...prev, text: event.target.value }))}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isReviewSubmitting}>
                {isReviewSubmitting ? "投稿中..." : "口コミを投稿する"}
              </Button>
            </form>
          </section>
        )}
      </div>

      <BottomNav currentPage="search" />
    </div>
  )
}
