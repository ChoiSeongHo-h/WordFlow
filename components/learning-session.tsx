// components/learning-session.tsx
"use client"

import { useRouter } from "next/navigation"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut"
import { useLearningSession } from "@/hooks/use-learning-session"
import { SentenceInput } from "@/components/learning/sentence-input"
import { SessionFeedback } from "@/components/learning/session-feedback" 
import { SessionComplete } from "@/components/learning/session-complete"

interface LearningSessionProps {
  deckId: string
  deckTitle: string
  totalQuestions: number
}

export function LearningSession({ deckId, deckTitle, totalQuestions }: LearningSessionProps) {
  const router = useRouter()
  const session = useLearningSession(deckId, totalQuestions)

  // Global Shortcuts
  useKeyboardShortcut("Escape", () => router.push("/"))
  useKeyboardShortcut("Enter", () => {
    if (session.status === "complete") {
      session.resetSession()
    } else if (session.status === "incorrect") {
      session.showHint()
    } else if (session.status === "hint") {
      session.moveToNext()
    }
  })

  if (session.status === "complete") {
    return (
      <SessionComplete 
        completedCount={session.completedCount} 
        totalWords={totalQuestions} 
        onDashboard={() => router.push("/")}
        onRetry={session.resetSession} 
      />
    )
  }

  if (!session.currentWord && session.status !== "complete") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20">
      <Progress value={session.progressPercentage} className="fixed top-0 left-0 z-50 h-1 w-full rounded-none" />

      <header className="flex items-center justify-between px-4 py-3 md:px-8">
        <div className="flex flex-1 items-center gap-4">
          <span className="text-xs font-medium text-muted-foreground">
            {session.currentIndex + 1} / {totalQuestions}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">{deckTitle}</span>
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <X className="size-5" />
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="flex w-full max-w-3xl flex-col items-center gap-12">
          {/* Korean Translation */}
          <p className="text-center text-lg md:text-xl text-muted-foreground/80 font-light tracking-wide">
            {session.currentWord && (
              session.currentWord.koreanHighlight ? (
                session.currentWord.korean.split(session.currentWord.koreanHighlight).map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && <strong className="font-medium text-foreground">{session.currentWord?.koreanHighlight}</strong>}
                  </span>
                ))
              ) : (
                session.currentWord.korean
              )
            )}
          </p>

          {/* Interactive Sentence */}
          {session.currentWord && (
            <div className="text-center text-2xl md:text-3xl leading-relaxed">
              <SentenceInput
                currentWord={session.currentWord}
                status={session.status}
                onInputChange={session.handleInputStart}
                onSubmit={session.submitAnswer}
                onHintRequest={session.showHint}
                onSkip={session.moveToNext}
              />
            </div>
          )}

          {/* Feedback Area */}
          <div className="flex h-20 w-full flex-col items-center justify-start gap-3 relative">
            {session.currentWord && (
              <SessionFeedback 
                status={session.status} 
                currentWord={session.currentWord} 
                onShowHint={session.showHint} 
                onNext={session.moveToNext} 
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
