"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { X, Eye, Check, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { WordItem } from "@/lib/api"
import { cn } from "@/lib/utils"
import { verifyAnswer, saveProgressLocally, loadLocalProgress } from "@/lib/api"

type AnswerState = "idle" | "correct" | "incorrect"

interface LearningSessionProps {
  deckId: string
  deckTitle: string
  initialWords: WordItem[]
}

export function LearningSession({ deckId, deckTitle, initialWords: words }: LearningSessionProps) {
  const router = useRouter()
  
  // UI structural states
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answerState, setAnswerState] = useState<AnswerState>("idle")
  const [showHint, setShowHint] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  
  // Direct DOM refs for zero-latency performance
  const inputRef = useRef<HTMLInputElement>(null)
  const spanRef = useRef<HTMLSpanElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const currentWord = words[currentIndex]
  const progressPercentage = Math.round((currentIndex / words.length) * 100)

  // 1. Initialize local progress on mount
  useEffect(() => {
    const saved = loadLocalProgress(deckId);
    if (saved && saved.currentIndex < words.length) {
      setCurrentIndex(saved.currentIndex);
      setCompletedCount(saved.completedCount);
    }
  }, [deckId, words.length]);

  // 2. Sync input state on word change
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
      updateInputWidth("");
    }
  }, [currentIndex]);

  // 3. Zero-Latency Width Calculation (Direct DOM Access)
  const updateInputWidth = useCallback((value: string) => {
    if (spanRef.current && inputRef.current) {
      spanRef.current.textContent = value || currentWord?.answer || "";
      const width = Math.max(80, spanRef.current.offsetWidth + 24);
      inputRef.current.style.width = `${width}px`;
    }
  }, [currentWord]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    updateInputWidth(val);
    
    // Immediate visual reset of error state
    if (answerState === "incorrect") {
      setAnswerState("idle");
    }
  }, [answerState, updateInputWidth]);

  const moveToNext = useCallback(() => {
    if (currentIndex < words.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setAnswerState("idle");
      setShowHint(false);
      saveProgressLocally(deckId, nextIndex, completedCount);
    } else {
      setSessionComplete(true);
      saveProgressLocally(deckId, 0, 0); // Reset for next time
    }
  }, [currentIndex, words.length, deckId, completedCount]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    const inputValue = inputRef.current?.value.trim() || "";
    if (!inputValue || isValidating) return;

    setIsValidating(true);
    try {
      const result = await verifyAnswer(currentWord.id, inputValue);
      
      if (result.isCorrect) {
        setAnswerState("correct");
        setCompletedCount((prev) => prev + 1);
        setTimeout(() => moveToNext(), 600);
      } else {
        setAnswerState("incorrect");
        // Trigger hardware-accelerated shake animation
        if (inputRef.current) {
          inputRef.current.classList.remove("animate-shake");
          void inputRef.current.offsetWidth; // Reflow trigger
          inputRef.current.classList.add("animate-shake");
        }
      }
    } catch (error) {
      console.error("Verification failed", error);
    } finally {
      setIsValidating(false);
    }
  }, [currentWord.id, isValidating, moveToNext]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (answerState === "correct") moveToNext();
      else handleSubmit();
    }
  };

  const renderSentence = () => {
    if (!currentWord) return null
    const parts = currentWord.english.split("___")
    if (parts.length < 2) return <span>{currentWord.english}</span>

    return (
      <form onSubmit={handleSubmit} ref={formRef} className="inline leading-relaxed m-0 p-0">
        <span className="text-foreground">{parts[0]}</span>
        <span className="relative inline-block align-baseline">
          {/* Measurement Span: Hidden from UI, used to calculate input width */}
          <span 
            ref={spanRef} 
            className="absolute left-0 top-0 -z-10 opacity-0 whitespace-pre text-2xl font-bold md:text-3xl pointer-events-none" 
            aria-hidden="true"
          >
            {currentWord.answer}
          </span>
          <input
            ref={inputRef}
            type="text"
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={answerState === "correct" || isValidating}
            className={cn(
              "inline-block rounded-lg border-2 bg-card px-2 py-1 text-center text-2xl font-bold outline-none transition-colors duration-200 md:text-3xl",
              answerState === "idle" && "border-input focus:border-primary",
              answerState === "correct" && "border-success bg-success/10 text-success",
              answerState === "incorrect" && "border-destructive text-destructive",
              isValidating && "opacity-70"
            )}
            style={{ width: "80px", willChange: "width, transform, background-color" }}
            autoComplete="off"
            spellCheck="false"
          />
          {/* Layout-stable loader space */}
          <div className={cn(
            "absolute -bottom-8 left-1/2 -translate-x-1/2 transition-opacity duration-200",
            isValidating ? "opacity-100" : "opacity-0 pointer-events-none"
          )}>
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        </span>
        <span className="text-foreground">{parts[1]}</span>
      </form>
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
            <h2 className="text-3xl font-bold text-foreground">Session Complete</h2>
            <p className="mt-2 text-muted-foreground">You mastered {completedCount} out of {words.length} words!</p>
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
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-3 md:px-8">
        <div className="flex flex-1 items-center gap-4">
          <Progress value={progressPercentage} className="h-1 max-w-xs" />
          <span className="text-xs text-muted-foreground">{currentIndex + 1} / {words.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">{deckTitle}</span>
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}><X className="size-5" /></Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="flex w-full max-w-2xl flex-col items-center gap-10">
          <p className="text-center text-base text-muted-foreground leading-relaxed md:text-lg">
            {currentWord?.korean.split(currentWord.koreanHighlight).map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && <strong className="font-bold text-foreground">{currentWord.koreanHighlight}</strong>}
              </span>
            ))}
          </p>

          <div className="text-center text-2xl font-medium text-foreground leading-relaxed md:text-3xl">
            {renderSentence()}
          </div>

          {/* Feedback area with fixed height to prevent Layout Shift */}
          <div className="flex h-[80px] w-full flex-col items-center justify-start gap-3 relative">
            <div className="absolute inset-0 flex flex-col items-center">
              {answerState === "correct" && (
                <div className="flex items-center gap-2 text-success animate-in fade-in zoom-in-95 duration-200">
                  <Check className="size-5" />
                  <span className="font-medium">Correct!</span>
                </div>
              )}

              {answerState === "incorrect" && !showHint && (
                <div className="flex items-center gap-3 animate-in fade-in duration-200">
                  <Button variant="outline" size="sm" onClick={() => setShowHint(true)} tabIndex={2}>
                    <Eye className="size-4 mr-2" />
                    Show Hint
                  </Button>
                </div>
              )}

              {answerState === "incorrect" && showHint && (
                <div className="flex flex-col items-center gap-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
                  <p className="text-sm text-muted-foreground">
                    {"The answer is: "}
                    <strong className="text-foreground">{currentWord.answer}</strong>
                  </p>
                  <Button size="sm" onClick={moveToNext} className="gap-1.5" autoFocus>
                    Next Word
                    <ArrowRight className="size-3.5" />
                  </Button>
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