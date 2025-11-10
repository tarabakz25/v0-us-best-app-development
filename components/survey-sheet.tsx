"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"

interface SurveyQuestion {
  question: string
  options?: string[]
}

interface SurveySheetProps {
  survey: {
    id: string
    title: string
    description: string
    brand?: string | null
    mediaUrl: string
    questions?: SurveyQuestion[]
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedOptions: Record<string, string>
  onSelectOption: (question: string, option: string) => void
  onSubmit: () => void
  isSubmitting: boolean
  hasSubmitted: boolean
  results: Record<string, { totalVotes: number; options: Record<string, number> }>
  totalResponses: number
  isResultsLoading: boolean
}

export function SurveySheet({
  survey,
  open,
  onOpenChange,
  selectedOptions,
  onSelectOption,
  onSubmit,
  isSubmitting,
  hasSubmitted,
  results,
  totalResponses,
  isResultsLoading,
}: SurveySheetProps) {
  const questions = (survey.questions || []).filter((q) => q?.question?.trim())
  const allQuestionsAnswered = questions.every((q) => selectedOptions[q.question])
  const showResults = hasSubmitted && questions.length > 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="mb-4 text-left">
          <SheetTitle className="text-2xl text-balance">{survey.title}</SheetTitle>
          <SheetDescription className="text-pretty">{survey.description}</SheetDescription>
          {survey.brand && <p className="text-sm text-muted-foreground">by {survey.brand}</p>}
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto h-[calc(85vh-144px)] pb-6">
          <div className="relative aspect-video rounded-xl overflow-hidden">
            <img
              src={survey.mediaUrl || "/placeholder.svg"}
              alt={survey.title}
              className="w-full h-full object-cover"
            />
          </div>

          <Separator />

          {questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">このアンケートにはまだ質問が設定されていません。</p>
          ) : showResults ? (
            <div className="space-y-6">
              {questions.map((question, index) => {
                const availableOptions = (question.options || []).filter((option) => option && option.trim() !== "")
                const questionResult = results[question.question] || {
                  totalVotes: totalResponses,
                  options: {},
                }
                const totalVotesForQuestion = questionResult.totalVotes || totalResponses

                return (
                  <div key={`${question.question}-${index}`} className="space-y-3">
                    <div>
                      <p className="font-semibold text-base">
                        {index + 1}. {question.question}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {totalVotesForQuestion > 0 ? `${totalVotesForQuestion}件の投票` : "まだ投票がありません"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {availableOptions.map((option, optionIndex) => {
                        const votes = questionResult.options[option] || 0
                        const percentage = totalVotesForQuestion > 0 ? Math.round((votes / totalVotesForQuestion) * 100) : 0
                        const isUserChoice = selectedOptions[question.question] === option

                        return (
                          <div key={`${option}-${optionIndex}`} className="space-y-1">
                            <div className="relative h-12 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className={`absolute inset-y-0 left-0 ${
                                  isUserChoice ? "bg-primary/80" : "bg-white/25"
                                } transition-all`}
                                style={{ width: `${percentage}%` }}
                              />
                              <div className="relative z-10 flex h-full items-center justify-between px-4 text-sm font-medium">
                                <span className={isUserChoice ? "text-white font-semibold" : "text-white"}>{option}</span>
                                <span className="text-xs text-white/90">
                                  {votes}票 ({percentage}%)
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {isResultsLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>集計を更新しています...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question, index) => {
                const availableOptions = (question.options || []).filter((option) => option && option.trim() !== "")
                return (
                  <div key={`${question.question}-${index}`} className="space-y-3">
                    <p className="font-semibold text-base">
                      {index + 1}. {question.question}
                    </p>
                    <div className="grid gap-2">
                      {availableOptions.map((option, optionIndex) => {
                        const isSelected = selectedOptions[question.question] === option
                        return (
                          <Button
                            key={`${option}-${optionIndex}`}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            className={`justify-start text-left ${
                              isSelected ? "" : "bg-transparent text-foreground"
                            }`}
                            onClick={() => onSelectOption(question.question, option)}
                          >
                            {option}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {questions.length > 0 && !showResults && (
          <Button className="w-full mt-4" onClick={onSubmit} disabled={isSubmitting || !allQuestionsAnswered}>
            {isSubmitting ? "投票中..." : "投票する"}
          </Button>
        )}
      </SheetContent>
    </Sheet>
  )
}
