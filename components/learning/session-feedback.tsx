// components/learning/session-feedback.tsx
"use client"

import { Check, Eye, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd" // UI 라이브러리에 Kbd가 있다고 가정하거나 기본 kbd 태그 사용
import type { WordItem } from "@/lib/api"
import type { SessionStatus } from "@/hooks/use-learning-session"

interface SessionFeedbackProps {
  status: SessionStatus
  currentWord: WordItem
  onShowHint: () => void
  onNext: () => void
}

export function SessionFeedback({ status, currentWord, onShowHint, onNext }: SessionFeedbackProps) {
  if (status === "correct") {
    return (
      <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2 text-success">
          <Check className="size-5" />
          <span className="font-medium">Correct!</span>
        </div>
        <div className="flex flex-col items-center gap-2 mt-2">
          <Button size="sm" onClick={onNext} className="gap-1.5" variant="outline">
            Next Word
            <ArrowRight className="size-3.5" />
          </Button>
          <p className="text-[10px] text-muted-foreground/50">
            Press <kbd className="font-mono bg-muted border border-muted-foreground/20 px-1 py-0.5 rounded">Enter</kbd> to skip
          </p>
        </div>
      </div>
    )
  }

  if (status === "incorrect") {
    return (
      <div className="flex flex-col items-center gap-2 animate-in fade-in duration-200">
        <Button variant="outline" size="sm" onClick={onShowHint}>
          <Eye className="size-4 mr-2" />
          Show Hint
        </Button>
        <p className="text-[10px] text-muted-foreground/50">
          Press <kbd className="font-mono bg-muted border border-muted-foreground/20 px-1 py-0.5 rounded">Enter</kbd> for hint
        </p>
      </div>
    )
  }

  if (status === "hint") {
    return (
      <div className="flex flex-col items-center gap-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
        <p className="text-sm text-muted-foreground">
          {"The answer is: "}
          <strong className="text-foreground font-mono tracking-wider">{currentWord.answer}</strong>
        </p>
        <div className="flex flex-col items-center gap-2">
          <Button size="sm" onClick={onNext} className="gap-1.5">
            Next Word
            <ArrowRight className="size-3.5" />
          </Button>
          <p className="text-[10px] text-muted-foreground/50">
            Press <kbd className="font-mono bg-muted border border-muted-foreground/20 px-1 py-0.5 rounded">Enter</kbd> to skip
          </p>
        </div>
      </div>
    )
  }

  return (
    <p className="text-xs text-muted-foreground opacity-70">
      Type the word and press Enter
    </p>
  )
}