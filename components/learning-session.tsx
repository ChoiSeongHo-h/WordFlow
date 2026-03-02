"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { X, Eye, Check, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { WordItem } from "@/lib/api"
import { cn } from "@/lib/utils"
import { verifyAnswer } from "@/lib/api"

type AnswerState = "idle" | "correct" | "incorrect"

interface LearningSessionProps {
  deckTitle: string
  initialWords: WordItem[]
}

export function LearningSession({ deckTitle, initialWords: words }: LearningSessionProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [inputValue, setInputValue] = useState("")
  const [answerState, setAnswerState] = useState<AnswerState>("idle")
  const [showHint, setShowHint] = useState(false)
  const [shake, setShake] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const spanRef = useRef<HTMLSpanElement>(null)
  const [inputWidth, setInputWidth] = useState(80)

  const currentWord = words[currentIndex]
  const progressPercentage = Math.round((currentIndex / words.length) * 100)

  // Auto-focus input on mount and word change
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [currentIndex])

  // Dynamic width adjustment based on content
  useEffect(() => {
    if (spanRef.current) {
      const width = Math.max(80, spanRef.current.offsetWidth + 24)
      setInputWidth(width)
    }
  }, [inputValue])

  const moveToNext = useCallback(() => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setInputValue("")
      setAnswerState("idle")
      setShowHint(false)
      setShake(false)
    } else {
      setSessionComplete(true)
    }
  }, [currentIndex, words.length])

  const handleSubmit = useCallback(async () => {
    if (!inputValue.trim() || isValidating) return

    setIsValidating(true)
    try {
      const result = await verifyAnswer(currentWord.id, inputValue.trim())
      
      if (result.isCorrect) {
        setAnswerState("correct")
        setCompletedCount((prev) => prev + 1)
        setTimeout(() => {
          moveToNext()
        }, 800)
      } else {
        setAnswerState("incorrect")
        setShake(true)
        setTimeout(() => setShake(false), 500)
      }
    } catch (error) {
      console.error("Verification failed", error)
    } finally {
      setIsValidating(false)
    }
  }, [inputValue, currentWord.id, isValidating, moveToNext])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (answerState === "correct") {
        moveToNext()
      } else {
        handleSubmit()
      }
    }
  }

  const renderSentence = () => {
    if (!currentWord) return null
    const parts = currentWord.english.split("___")
    if (parts.length < 2) return <span>{currentWord.english}</span>

    return (
      <span className="inline leading-relaxed">
        <span className="text-foreground">{parts[0]}</span>
        <span className="relative inline-block align-baseline">
          <span ref={spanRef} className="invisible absolute whitespace-pre text-2xl font-bold md:text-3xl" aria-hidden="true">
            {inputValue || currentWord.answer}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              if (answerState === "idle" || answerState === "incorrect") {
                setInputValue(e.target.value)
                if (answerState === "incorrect") setAnswerState("idle")
              }
            }}
            onKeyDown={handleKeyDown}
            disabled={answerState === "correct" || isValidating}
            className={cn(
              "inline-block rounded-lg border-2 bg-card px-2 py-1 text-center text-2xl font-bold outline-none transition-all duration-200 md:text-3xl",
              answerState === "idle" && "border-input focus:border-primary",
              answerState === "correct" && "border-success bg-success/10 text-success",
              answerState === "incorrect" && "border-destructive text-destructive",
              isValidating && "opacity-70",
              shake && "animate-shake"
            )}
            style={{ width: `${inputWidth}px` }}
            autoComplete="off"
          />
          {isValidating && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
              <Loader2 className="size-5 animate-spin text-primary" />
            </div>
          )}
        </span>
        <span className="text-foreground">{parts[1]}</span>
      </span>
    )
  }

  if (sessionComplete) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-success/10">
            <Check className="size-10 text-success" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground font-[family-name:var(--font-heading)]">
              Session Complete
            </h2>
            <p className="mt-2 text-muted-foreground">
              You mastered {completedCount} out of {words.length} words!
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push("/")}>
              Back to Dashboard
            </Button>
            <Button
              onClick={() => {
                setCurrentIndex(0)
                setInputValue("")
                setAnswerState("idle")
                setShowHint(false)
                setCompletedCount(0)
                setSessionComplete(false)
              }}
            >
              Practice Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-3 md:px-8">
        <div className="flex flex-1 items-center gap-4">
          <Progress value={progressPercentage} className="h-1 max-w-xs" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {currentIndex + 1} / {words.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {deckTitle}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            aria-label="Exit session"
          >
            <X className="size-5" />
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="flex w-full max-w-2xl flex-col items-center gap-10">
          <p className="text-center text-base text-muted-foreground leading-relaxed md:text-lg">
            {currentWord?.korean.split(currentWord.koreanHighlight).map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <strong className="font-bold text-foreground">
                    {currentWord.koreanHighlight}
                  </strong>
                )}
              </span>
            ))}
          </p>

          <div className="text-center text-2xl font-medium text-foreground leading-relaxed md:text-3xl">
            {renderSentence()}
          </div>

          <div className="flex min-h-[48px] flex-col items-center gap-3">
            {answerState === "correct" && (
              <div className="flex items-center gap-2 text-success animate-in fade-in duration-300">
                <Check className="size-5" />
                <span className="font-medium">Correct!</span>
              </div>
            )}

            {answerState === "incorrect" && !showHint && (
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setShowHint(true)}>
                  <Eye className="size-4" />
                  Show Hint
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  setInputValue("")
                  setAnswerState("idle")
                }}>
                  Try Again
                </Button>
              </div>
            )}

            {answerState === "incorrect" && showHint && (
              <div className="flex flex-col items-center gap-3 animate-in fade-in duration-300">
                <p className="text-sm text-muted-foreground">
                  {"The answer is: "}
                  <strong className="text-foreground">{currentWord.answer}</strong>
                </p>
                <Button size="sm" onClick={moveToNext} className="gap-1.5">
                  Next Word
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            )}

            {answerState === "idle" && (
              <p className="text-xs text-muted-foreground">
                Type the word and press Enter
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}