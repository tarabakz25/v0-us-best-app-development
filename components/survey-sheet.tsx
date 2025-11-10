"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

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
}

export function SurveySheet({
  survey,
  open,
  onOpenChange,
  selectedOptions,
  onSelectOption,
  onSubmit,
  isSubmitting,
}: SurveySheetProps) {
  const questions = (survey.questions || []).filter((q) => q?.question?.trim())

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

        {questions.length > 0 && (
          <Button className="w-full mt-4" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "送信中..." : "回答を送信"}
          </Button>
        )}
      </SheetContent>
    </Sheet>
  )
}
