"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { X, Eye, Check, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { WordItem } from "@/lib/api"
import { cn } from "@/lib/utils"
import { verifyAnswer, saveProgressLocally, loadLocalProgress } from "@/lib/api"

/**
 * Custom hook to handle global keyboard shortcuts.
 */
export function useKeyboardShortcut(key: string, callback: () => void, disabled: boolean = false) {
  useEffect(() => {
    if (disabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === key) {
        // Execute global shortcut if not in an input, or if it's Escape
        if (event.target instanceof HTMLInputElement && key !== "Escape") {
          return
        }
        
        event.preventDefault()
        callback()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [key, callback, disabled])
}

interface LearningSessionProps {
  deckId: string
  deckTitle: string
  initialWords: WordItem[]
}

type AnswerState = "idle" | "correct" | "incorrect"

export function LearningSession({ deckId, deckTitle, initialWords: words }: LearningSessionProps) {
  const router = useRouter()
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answerState, setAnswerState] = useState<AnswerState>("idle")
  const [showHint, setShowHint] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const spanRef = useRef<HTMLSpanElement>(null)

  const currentWord = words[currentIndex]
  const progressPercentage = Math.round((currentIndex / words.length) * 100)

  // 1. Initialize local progress on mount
  useEffect(() => {
    const saved = loadLocalProgress(deckId)
    if (saved && saved.currentIndex < words.length) {
      setCurrentIndex(saved.currentIndex)
      setCompletedCount(saved.completedCount)
    }
  }, [deckId, words.length])

  // 2. Zero-Latency Width Calculation
  const updateInputWidth = useCallback((value: string) => {
    if (spanRef.current && inputRef.current) {
      // Use current input value or current word answer for width baseline
      spanRef.current.textContent = value || currentWord?.answer || ""
      const width = Math.max(60, spanRef.current.offsetWidth + 16)
      inputRef.current.style.width = `${width}px`
    }
  }, [currentWord])

  // 3. Reset Input and Focus Management
  // Only clear input when the word actually changes (currentIndex changes)
  useEffect(() => {
    if (!sessionComplete && inputRef.current) {
      inputRef.current.value = ""
      updateInputWidth("")
    }
  }, [currentIndex, sessionComplete, updateInputWidth])

  // Handle auto-focus separately to avoid clearing input during validation
  useEffect(() => {
    if (!sessionComplete && !isValidating && answerState !== "correct") {
      inputRef.current?.focus()
    }
  }, [currentIndex, isValidating, answerState, sessionComplete])

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    updateInputWidth(val)
    
    if (answerState === "incorrect") {
      setAnswerState("idle")
      setShowHint(false)
    }
  }, [answerState, updateInputWidth])

  const moveToNext = useCallback(() => {
    if (currentIndex < words.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      setAnswerState("idle")
      setShowHint(false)
      saveProgressLocally(deckId, nextIndex, completedCount)
    } else {
      setSessionComplete(true)
      saveProgressLocally(deckId, 0, 0)
    }
  }, [currentIndex, words.length, deckId, completedCount])

  const handleSubmit = useCallback(async () => {
    const inputValue = inputRef.current?.value.trim() || ""
    if (!inputValue || isValidating || answerState === "correct") return

    setIsValidating(true)
    try {
      const result = await verifyAnswer(currentWord.id, inputValue)
      
      if (result.isCorrect) {
        setAnswerState("correct")
        setCompletedCount((prev) => prev + 1)
        setTimeout(() => moveToNext(), 600)
      } else {
        setAnswerState("incorrect")
      }
    } catch (error) {
      console.error("Verification failed", error)
    } finally {
      setIsValidating(false)
    }
  }, [currentWord?.id, isValidating, answerState, moveToNext])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (isValidating) return

      if (answerState === "correct") {
        // Already moving via setTimeout, but allow manual skip
        moveToNext()
      } else if (answerState === "incorrect") {
        if (showHint) {
          moveToNext()
        } else {
          setShowHint(true)
        }
      } else {
        handleSubmit()
      }
    }
  }

  useKeyboardShortcut("Escape", () => {
    router.push("/")
  })

  const handleGlobalEnter = useCallback(() => {
    if (sessionComplete) {
      setCurrentIndex(0)
      setAnswerState("idle")
      setSessionComplete(false)
      setCompletedCount(0)
    } else if (answerState === "incorrect") {
      if (showHint) moveToNext()
      else setShowHint(true)
    }
  }, [sessionComplete, answerState, showHint, moveToNext])

  useKeyboardShortcut("Enter", handleGlobalEnter)

  const handleBlur = useCallback(() => {
    // Keep focus unless the session is over or a hint is being shown
    if (!sessionComplete && !isValidating && !showHint && answerState !== "correct") {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 10)
    }
  }, [sessionComplete, isValidating, showHint, answerState])

  const renderSentence = () => {
    if (!currentWord) return null
    const parts = currentWord.english.split("___")
    if (parts.length < 2) return <span className="text-foreground">{currentWord.english}</span>

    return (
      <span className="inline leading-relaxed m-0 p-0 text-foreground/40 font-medium tracking-wide transition-colors duration-300 focus-within:text-foreground/70">
        {/* Dim surrounding text to focus entirely on the blank (Signal-to-Noise optimization) */}
        <span className="text-foreground/90">{parts[0]}</span>
        
        <span className="relative inline-block align-baseline mx-1">
          <span 
            ref={spanRef} 
            className="absolute left-0 top-0 -z-10 opacity-0 whitespace-pre text-2xl md:text-3xl font-bold pointer-events-none" 
            aria-hidden="true"
          >
            {currentWord.answer}
          </span>
          <input
            ref={inputRef}
            type="text"
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            disabled={answerState === "correct" || isValidating}
            aria-label="Fill in the blank"
            className={cn(
              "inline-block bg-transparent text-center text-2xl md:text-3xl font-semibold outline-none transition-all duration-300",
              "border-b-2 placeholder:text-transparent",
              answerState === "idle" && "border-muted-foreground/30 focus:border-primary text-primary",
              answerState === "correct" && "border-success text-success animate-spring-pop", // 정답 효과
              answerState === "incorrect" && "border-destructive text-destructive animate-shake", // 오답 효과 추가
              isValidating && "opacity-50"
            )}
            style={{ width: "60px", willChange: "width, transform" }}
            // Use hardware acceleration for width and color changes
            style={{ width: "60px", willChange: "width, transform" }}
            autoComplete="off"
            spellCheck="false"
            autoFocus
          />
          {/* ... loader code ... */}
        </span>
        <span className="text-foreground/90">{parts[1]}</span>
      </span>
    )
  }

  if (sessionComplete) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 animate-in fade-in duration-700">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-success/10">
            <Check className="size-10 text-success" />
          </div>
          <div>
            <h2 className="text-4xl font-semibold tracking-tight text-foreground">Session Complete</h2>
            <p className="mt-2 text-lg text-muted-foreground">You mastered {completedCount} out of {words.length} words!</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push("/")}>Dashboard</Button>
            <Button onClick={() => {
              setCurrentIndex(0);
              setAnswerState("idle");
              setSessionComplete(false);
              setCompletedCount(0);
            }}>Practice Again</Button>
          </div>
          <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground/60">
            <p>Press <kbd className="font-mono bg-muted border border-muted-foreground/20 px-1.5 py-0.5 rounded text-foreground">Enter</kbd> to practice again</p>
            <p>Press <kbd className="font-mono bg-muted border border-muted-foreground/20 px-1.5 py-0.5 rounded text-foreground">ESC</kbd> to return to dashboard</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20">
      <Progress 
        value={progressPercentage} 
        className="fixed top-0 left-0 right-0 z-50 h-0.5 w-full rounded-none bg-transparent" 
      />

      <header className="flex items-center justify-between px-4 py-3 md:px-8">
        <div className="flex flex-1 items-center gap-4">
          <span className="text-xs font-medium text-muted-foreground">{currentIndex + 1} / {words.length}</span>
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
          <p className="text-center text-lg md:text-xl text-muted-foreground/80 font-light tracking-wide animate-in slide-in-from-bottom-2 fade-in duration-500">
            {currentWord?.korean.split(currentWord.koreanHighlight).map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && <strong className="font-medium text-foreground">{currentWord.koreanHighlight}</strong>}
              </span>
            ))}
          </p>

          <div className="text-center text-2xl md:text-3xl leading-[1.6] animate-in slide-in-from-bottom-3 fade-in duration-700 delay-100">
            {renderSentence()}
          </div>

          <div className="flex h-[80px] w-full flex-col items-center justify-start gap-3 relative">
            <div className="absolute inset-0 flex flex-col items-center">
              {answerState === "correct" && (
                <div className="flex items-center gap-2 text-success animate-in fade-in zoom-in-95 duration-200">
                  <Check className="size-5" />
                  <span className="font-medium">Correct!</span>
                </div>
              )}

              {answerState === "incorrect" && !showHint && (
                <div className="flex flex-col items-center gap-2 animate-in fade-in duration-200">
                  <Button variant="outline" size="sm" onClick={() => setShowHint(true)}>
                    <Eye className="size-4 mr-2" />
                    Show Hint
                  </Button>
                  <p className="text-[10px] text-muted-foreground/50">
                    Press <kbd className="font-mono bg-muted border border-muted-foreground/20 px-1 py-0.5 rounded">Enter</kbd> for hint
                  </p>
                </div>
              )}

              {answerState === "incorrect" && showHint && (
                <div className="flex flex-col items-center gap-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
                  <p className="text-sm text-muted-foreground">
                    {"The answer is: "}
                    <strong className="text-foreground font-mono tracking-wider">{currentWord.answer}</strong>
                  </p>
                  <div className="flex flex-col items-center gap-2">
                    <Button size="sm" onClick={moveToNext} className="gap-1.5">
                      Next Word
                      <ArrowRight className="size-3.5" />
                    </Button>
                    <p className="text-[10px] text-muted-foreground/50">
                      Press <kbd className="font-mono bg-muted border border-muted-foreground/20 px-1 py-0.5 rounded">Enter</kbd> to skip
                    </p>
                  </div>
                </div>
              )}

              {answerState === "idle" && (
                <p className="text-xs text-muted-foreground opacity-70">
                  Type the word and press Enter
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}