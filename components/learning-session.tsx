// components/learning-session.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
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

  const [isKeyboardActive, setIsKeyboardActive] = useState(false)

  // 1. HTML/Body scroll & position lock (Prevent page bounce / scroll leaks)
  useEffect(() => {
    if (typeof window === "undefined") return

    const originalHtmlStyle = document.documentElement.getAttribute("style") || ""
    const originalBodyStyle = document.body.getAttribute("style") || ""

    const lockDocument = () => {
      document.documentElement.style.position = "fixed"
      document.documentElement.style.overflow = "hidden"
      document.documentElement.style.width = "100%"
      document.documentElement.style.height = "100%"
      document.documentElement.style.overscrollBehavior = "none"

      document.body.style.position = "fixed"
      document.body.style.overflow = "hidden"
      document.body.style.width = "100%"
      document.body.style.height = "100%"
      document.body.style.overscrollBehavior = "none"
    }

    lockDocument()

    return () => {
      if (originalHtmlStyle) {
        document.documentElement.setAttribute("style", originalHtmlStyle)
      } else {
        document.documentElement.removeAttribute("style")
      }
      if (originalBodyStyle) {
        document.body.setAttribute("style", originalBodyStyle)
      } else {
        document.body.removeAttribute("style")
      }
    }
  }, [])

  // 2. Visual Viewport API height mapping & dynamic keyboard state tracking
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return

    const handleResize = () => {
      const vv = window.visualViewport
      if (!vv) return
      
      // Update CSS custom property directly for buttery smooth 60fps animations
      document.documentElement.style.setProperty("--visual-viewport-height", `${vv.height}px`)

      const isMobile = window.innerWidth < 768
      const active = isMobile && vv.height < window.innerHeight - 140
      
      // Prevent unnecessary React renders by using functional state updater with prev comparison
      setIsKeyboardActive((prev) => (prev !== active ? active : prev))

      if (active) {
        // Reset scroll position to 0 to prevent iOS layout offset
        window.scrollTo(0, 0)
        if (document.documentElement) document.documentElement.scrollTop = 0
        if (document.body) document.body.scrollTop = 0

        // Secondary safety reset to capture any delayed layout shifts
        const resetScroll = () => {
          window.scrollTo(0, 0)
          if (document.documentElement) document.documentElement.scrollTop = 0
          if (document.body) document.body.scrollTop = 0
        }
        setTimeout(resetScroll, 20)
        setTimeout(resetScroll, 60)
      }
    }

    handleResize()
    window.visualViewport.addEventListener("resize", handleResize)
    window.visualViewport.addEventListener("scroll", handleResize)
    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize)
      window.visualViewport?.removeEventListener("scroll", handleResize)
      document.documentElement.style.removeProperty("--visual-viewport-height")
    }
  }, [])

  // Global Shortcuts
  useKeyboardShortcut("Escape", () => router.push("/"))
  useKeyboardShortcut("Enter", () => {
    if (session.status === "complete") {
      session.resetSession()
    } else if (session.status === "incorrect") {
      session.showHint()
    } else if (session.status === "jumbled") {
      session.submitJumbledAnswer()
    } else if (session.status === "jumbled_incorrect") {
      session.showFinalAnswer()
    } else if (session.status === "show_answer" || session.status === "correct" || session.status === "typo") {
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

  if (!session.currentWord) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div 
      className="flex flex-col bg-background selection:bg-primary/20 overflow-hidden"
      style={{ height: "var(--visual-viewport-height, 100dvh)" }}
    >
      <Progress value={session.progressPercentage} className="fixed top-0 left-0 z-50 h-1 w-full rounded-none" />

      <header className={cn(
        "flex items-center justify-between px-4 md:px-8 transition-all duration-300",
        isKeyboardActive ? "py-1.5" : "py-3"
      )}>
        <div className="flex flex-1 items-center gap-4">
          <span className="text-xs font-medium text-muted-foreground">
            {session.completedCount} / {session.totalQuestions}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">{deckTitle}</span>
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <X className="size-5" />
          </Button>
        </div>
      </header>

      <main className={cn(
        "flex flex-1 flex-col items-center justify-center px-4 sm:px-6 transition-all duration-300",
        isKeyboardActive ? "py-2" : "py-6 sm:py-0"
      )}>
        <div className={cn(
          "flex w-full max-w-3xl flex-col items-center transition-all duration-300",
          isKeyboardActive ? "gap-2" : "gap-4 sm:gap-6 md:gap-12"
        )}>
          {/* Korean Translation */}
          <p className="text-center text-base sm:text-lg md:text-xl text-muted-foreground/80 font-light tracking-wide">
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
            <div className="text-center text-xl sm:text-2xl md:text-3xl leading-relaxed">
              <SentenceInput
                currentWord={session.currentWord}
                status={session.status}
                onInputChange={session.handleInputStart}
                onSubmit={session.submitAnswer}
                onHintRequest={session.showHint}
                onSkip={session.moveToNext}
                placedLetters={session.placedLetters}
                onRemoveLetter={session.removePlacedLetter}
                jumbledLetters={session.jumbledLetters}
                onAddLetter={session.addPlacedLetter}
              />
            </div>
          )}

          {/* Feedback Area */}
          <div className={cn(
            "flex w-full flex-col items-center justify-start gap-3 relative transition-all duration-300",
            isKeyboardActive ? "min-h-[2.5rem]" : "min-h-[4.5rem] sm:min-h-[6rem]"
          )}>
            {session.currentWord && (
              <SessionFeedback 
                status={session.status} 
                currentWord={session.currentWord} 
                onShowHint={session.showHint} 
                onNext={session.moveToNext} 
                lastUserInput={session.lastUserInput}
                resultCorrectAnswer={session.resultCorrectAnswer}
                jumbledLetters={session.jumbledLetters}
                placedLetters={session.placedLetters}
                onAddLetter={session.addPlacedLetter}
                onSubmitJumbled={session.submitJumbledAnswer}
                onShowFinalAnswer={session.showFinalAnswer}
                onSubmit={() => {
                  const inputEl = document.querySelector('input')
                  if (inputEl && inputEl.value.trim()) {
                    session.submitAnswer(inputEl.value.trim())
                  }
                }}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
