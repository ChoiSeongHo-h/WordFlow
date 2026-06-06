// components/learning/session-feedback.tsx
"use client"

import { useState, useEffect } from "react"
import { Check, Eye, ArrowRight, AlertCircle, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { WordItem } from "@/lib/api"
import type { SessionStatus, JumbledLetter } from "@/hooks/use-learning-session"
import { useIsMobile } from "@/hooks/use-mobile"

interface SessionFeedbackProps {
  status: SessionStatus
  currentWord: WordItem
  onShowHint: () => void
  onNext: () => void
  lastUserInput?: string
  resultCorrectAnswer?: string
  jumbledLetters?: JumbledLetter[]
  placedLetters?: JumbledLetter[]
  onAddLetter?: (letter: JumbledLetter) => void
  onSubmitJumbled?: () => void
  onShowFinalAnswer?: () => void
  onSubmit?: () => void
  activeDrag: {
    letter: JumbledLetter
    source: "pool" | "placed"
    startIndex: number | null
    width: number
    grabOffset: { x: number; y: number }
  } | null
  onDragStart: (
    e: React.PointerEvent<HTMLButtonElement>,
    letter: JumbledLetter,
    source: "pool" | "placed",
    index: number | null
  ) => void
  hasDraggedRef: React.RefObject<boolean>
  poolContainerRef: React.RefObject<HTMLDivElement | null>
  activeKeyLetterIds: string[]
}

function TypoDiff({ user, correct }: { user: string; correct: string }) {
  return (
    <div className="flex items-center gap-2 text-xs md:text-sm font-medium">
      <span className="px-1.5 py-0.5 rounded bg-destructive/10 text-destructive/70 line-through decoration-destructive/30">
        {user}
      </span>
      <ArrowRight className="size-3 text-muted-foreground/30" />
      <span className="px-1.5 py-0.5 rounded bg-warning/20 text-warning-foreground font-bold animate-pulse">
        {correct}
      </span>
    </div>
  )
}

/*
 * 디바이스 및 상태(Status)별 키보드 활성화 여부 대응표:
 * 
 * | 디바이스 | 상태 (Status) | 키보드 상태 |
 * | :--- | :--- | :--- |
 * | **PC** | **일반 입력 (Idle/Validating)** | 키보드 활성화 |
 * | **PC** | **정답 맞힘 (Correct)** | 키보드 활성화 |
 * | **PC** | **오답 (Incorrect)** | 키보드 활성화 |
 * | **PC** | **힌트 입력 (Jumbled)** | 키보드 활성화 |
 * | **PC** | **힌트 틀림 (Jumbled/Incorrect)** | 키보드 활성화 |
 * | **PC** | **최종 정답 확인 (Show Answer)** | 키보드 활성화 |
 * | **모바일** | **일반 입력 (Idle/Validating)** | 키보드 활성화 |
 * | **모바일** | **정답 맞힘 (Correct)** | 키보드 활성화 |
 * | **모바일** | **오답 (Incorrect)** | 키보드 활성화 |
 * | **모바일** | **힌트 입력 (Jumbled)** | 키보드 비활성화 (가상 키보드 닫힘) |
 * | **모바일** | **힌트 틀림 (Jumbled/Incorrect)** | 키보드 비활성화 (가상 키보드 닫힘) |
 * | **모바일** | **최종 정답 확인 (Show Answer)** | 키보드 비활성화 (가상 키보드 닫힘) |
 */
export function SessionFeedback({ 
  status, 
  currentWord, 
  onShowHint, 
  onNext,
  lastUserInput,
  resultCorrectAnswer,
  jumbledLetters = [],
  placedLetters = [],
  onAddLetter,
  onSubmitJumbled,
  onShowFinalAnswer,
  onSubmit,
  activeDrag,
  onDragStart,
  hasDraggedRef,
  poolContainerRef,
  activeKeyLetterIds
}: SessionFeedbackProps) {
  const [isMounted, setIsMounted] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const isMobileDevice = isMounted && isMobile

  if (status === "correct") {
    return (
      <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center gap-2 mt-2">
          <Button size="sm" onClick={onNext} className="gap-1.5" variant="outline">
            Next Word (Enter)
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  if (status === "typo") {
    return (
      <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2 text-warning">
          <AlertCircle className="size-4" />
          <span className="font-semibold text-sm">Typo!</span>
        </div>
        {lastUserInput && resultCorrectAnswer && (
          <TypoDiff user={lastUserInput} correct={resultCorrectAnswer} />
        )}
        <div className="flex flex-col items-center gap-2 mt-1">
          <p className="text-[10px] text-muted-foreground/50">
            Continuing in a moment...
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
          Show Hint (Enter)
        </Button>
      </div>
    )
  }

  if (status === "jumbled" || status === "jumbled_incorrect") {
    return (
      <div 
        ref={poolContainerRef}
        className="flex flex-col items-center gap-4 animate-in slide-in-from-bottom-2 duration-300 w-full max-w-md"
      >
        <div className="flex flex-wrap justify-center gap-2">
          {jumbledLetters.map((letter) => {
            const isPlaced = placedLetters.some(pl => pl.id === letter.id)
            const isDraggingThis = activeDrag && activeDrag.source === "pool" && activeDrag.letter.id === letter.id
            const isKeyboardActive = activeKeyLetterIds.includes(letter.id)
            const hide = (isPlaced && !isKeyboardActive) || isDraggingThis

            return (
              <Button
                key={letter.id}
                variant="secondary"
                size="sm"
                className={cn(
                  "h-9 min-w-[2.25rem] font-bold text-lg transition-all touch-none select-none cursor-grab active:bg-primary active:text-primary-foreground active:scale-95 duration-100",
                  letter.char === " " && "bg-muted/50",
                  isKeyboardActive && "bg-primary text-primary-foreground scale-95",
                  hide && "opacity-0 pointer-events-none"
                )}
                style={{ viewTransitionName: hide ? "none" : `letter-${letter.id}` } as React.CSSProperties}
                onPointerDown={(e) => onDragStart(e, letter, "pool", null)}
                onClick={(e) => {
                  if (hasDraggedRef.current) {
                    e.preventDefault()
                    return
                  }
                  onAddLetter?.(letter)
                }}
              >
                {letter.char === " " ? "\u00A0" : letter.char}
              </Button>
            )
          })}
        </div>
        
        <div className="flex flex-col items-center gap-2">
          {status === "jumbled_incorrect" ? (
            <Button variant="destructive" size="sm" onClick={onShowFinalAnswer} className="gap-2">
              <Eye className="size-4" />
              {isMobileDevice ? "Show Answer" : "Show Answer (Enter)"}
            </Button>
          ) : (
            <Button 
              size="sm" 
              onClick={onSubmitJumbled} 
              className="gap-2"
              disabled={placedLetters.length !== jumbledLetters.length}
            >
              <Send className="size-4" />
              {isMobileDevice ? "Submit" : "Submit (Enter)"}
            </Button>
          )}
          <p className="text-[10px] text-muted-foreground/50">
            {status === "jumbled_incorrect" ? "Order is incorrect. Try again or show answer." : "Arrange all letters to submit"}
          </p>
        </div>
      </div>
    )
  }

  if (status === "show_answer") {
    return (
      <div className="flex flex-col items-center gap-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
        <p className="text-sm text-muted-foreground">
          {"The answer is: "}
          <strong className="text-foreground font-mono tracking-wider">{currentWord.answer}</strong>
        </p>
        <div className="flex flex-col items-center gap-2">
          <Button size="sm" onClick={onNext} className="gap-1.5">
            {isMobileDevice ? "Next Word" : "Next Word (Enter)"}
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button 
        size="sm" 
        onClick={onSubmit} 
        disabled={status === "validating"}
        className="gap-2"
      >
        <Send className="size-4" />
        Submit (Enter)
      </Button>
    </div>
  )
}
