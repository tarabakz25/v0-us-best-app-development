"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Send } from "lucide-react"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

type ContentType = "ad" | "remix" | "survey"

interface CommentWithProfile {
  id: string
  user_id: string
  text: string
  created_at: string
  profile?: {
    display_name?: string | null
    avatar_url?: string | null
  } | null
}

interface CommentSheetProps {
  contentId: string
  contentType: ContentType
  contentTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUserId?: string | null
  onCommentAdded?: () => void
}

export function CommentSheet({
  contentId,
  contentType,
  contentTitle,
  open,
  onOpenChange,
  currentUserId,
  onCommentAdded,
}: CommentSheetProps) {
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()
  const [comments, setComments] = useState<CommentWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newComment, setNewComment] = useState("")

  const fetchComments = useCallback(async () => {
    if (!contentId) return

    setIsLoading(true)
    try {
      const { data: commentRows, error } = await supabase
        .from("comments")
        .select("id, user_id, text, created_at")
        .eq("content_type", contentType)
        .eq("content_id", contentId)
        .order("created_at", { ascending: false })

      if (error) throw error

      if (!commentRows || commentRows.length === 0) {
        setComments([])
        return
      }

      const uniqueUserIds = Array.from(new Set(commentRows.map((comment) => comment.user_id)))
      let profilesMap = new Map<string, { display_name?: string | null; avatar_url?: string | null }>()

      if (uniqueUserIds.length > 0) {
        const { data: profileRows, error: profileError } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", uniqueUserIds)

        if (profileError) throw profileError

        profilesMap = new Map(profileRows?.map((profile) => [profile.id, profile]) || [])
      }

      const hydratedComments = commentRows.map<CommentWithProfile>((comment) => ({
        ...comment,
        profile: profilesMap.get(comment.user_id) || null,
      }))

      setComments(hydratedComments)
    } catch (error) {
      console.error("Error loading comments:", error)
      toast({
        title: "コメントの取得に失敗しました",
        description: "時間を置いて再度お試しください。",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [contentId, contentType, supabase, toast])

  useEffect(() => {
    if (!open) {
      setNewComment("")
      return
    }

    fetchComments()
  }, [open, fetchComments])

  const handleSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    if (!currentUserId) {
      toast({
        title: "ログインが必要です",
        description: "コメントするにはログインしてください。",
        variant: "destructive",
      })
      return
    }

    const trimmedComment = newComment.trim()
    if (!trimmedComment) {
      toast({
        title: "コメントを入力してください",
        description: "空のコメントは送信できません。",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const { error } = await supabase.from("comments").insert({
        user_id: currentUserId,
        content_type: contentType,
        content_id: contentId,
        text: trimmedComment,
      })

      if (error) throw error

      setNewComment("")
      onCommentAdded?.()
      await fetchComments()
      toast({
        title: "コメントを投稿しました",
        description: "フィードバックありがとうございます。",
      })
    } catch (error) {
      console.error("Error posting comment:", error)
      toast({
        title: "コメントの投稿に失敗しました",
        description: "時間を置いて再度お試しください。",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Intl.DateTimeFormat("ja-JP", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(timestamp))
    } catch {
      return ""
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 text-left">
          <SheetTitle className="text-xl">コメント</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground text-pretty">
            {contentTitle}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              読み込み中...
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground pt-12">
              まだコメントがありません。最初のコメントを投稿しましょう!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={comment.profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {(comment.profile?.display_name || "匿名")[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">
                      {comment.profile?.display_name || "匿名ユーザー"}
                    </p>
                    <span className="text-xs text-muted-foreground">{formatTimestamp(comment.created_at)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words mt-1">
                    {comment.text}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border px-6 py-4">
          {currentUserId ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Textarea
                placeholder="感想やフィードバックを共有しましょう"
                value={newComment}
                onChange={(event) => setNewComment(event.target.value)}
                rows={3}
                maxLength={400}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{newComment.length}/400</span>
                <Button type="submit" disabled={isSubmitting || newComment.trim().length === 0}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      送信中...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      コメントを投稿
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              コメントするにはログインしてください。
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
