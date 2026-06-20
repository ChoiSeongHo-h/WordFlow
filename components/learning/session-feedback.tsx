// components/learning/session-feedback.tsx
"use client"

import { useState, useEffect } from "react"
import { Check, Eye, ArrowRight, AlertCircle, Send, Keyboard, Volume2, CornerDownLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { WordItem } from "@/lib/api"
import type { SessionStatus, JumbledLetter } from "@/hooks/use-learning-session"
import { useIsMobile } from "@/hooks/use-mobile"

interface SessionFeedbackProps {
  isVirtualKeyboardEnabled: boolean
  onToggleVirtualKeyboard: () => void
  status: SessionStatus
  currentWord: WordItem
  onShowHint: () => void
  onNext: () => void
  lastUserInput?: string
  resultCorrectAnswer?: string
  isClose?: boolean
  diffCount?: number
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
  onReplay?: () => void
}

interface DiffOp {
  type: 'match' | 'substitute' | 'delete' | 'insert';
  charA?: string;
  charB?: string;
}

function alignStrings(A: string, B: string): DiffOp[] {
  const m = A.length;
  const n = B.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (A[i - 1].toLowerCase() === B[j - 1].toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + 1, // substitution
          dp[i - 1][j] + 1,     // deletion from A
          dp[i][j - 1] + 1      // insertion to A
        );
      }
    }
  }
  
  const ops: DiffOp[] = [];
  let i = m;
  let j = n;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && A[i - 1].toLowerCase() === B[j - 1].toLowerCase()) {
      ops.push({ type: 'match', charA: A[i - 1], charB: B[j - 1] });
      i--;
      j--;
    } else {
      const subCost = (i > 0 && j > 0) ? dp[i - 1][j - 1] : Infinity;
      const delCost = (i > 0) ? dp[i - 1][j] : Infinity;
      const insCost = (j > 0) ? dp[i][j - 1] : Infinity;
      
      const minCost = Math.min(subCost, delCost, insCost);
      
      if (minCost === subCost) {
        ops.push({ type: 'substitute', charA: A[i - 1], charB: B[j - 1] });
        i--;
        j--;
      } else if (minCost === delCost) {
        ops.push({ type: 'delete', charA: A[i - 1] });
        i--;
      } else {
        ops.push({ type: 'insert', charB: B[j - 1] });
        j--;
      }
    }
  }
  
  return ops.reverse();
}

function TypoDiff({ user, correct }: { user: string; correct: string }) {
  const ops = alignStrings(user, correct);
  
  const userSpans = ops.map((op, idx) => {
    if (op.type === 'match') {
      return <span key={idx}>{op.charA}</span>;
    }
    if (op.type === 'substitute' || op.type === 'delete') {
      return (
        <span 
          key={idx} 
          className="text-destructive font-extrabold bg-destructive/20 px-0.5 rounded-sm"
        >
          {op.charA}
        </span>
      );
    }
    return null;
  });

  const correctSpans = ops.map((op, idx) => {
    if (op.type === 'match') {
      return <span key={idx}>{op.charB}</span>;
    }
    if (op.type === 'substitute' || op.type === 'insert') {
      return (
        <span 
          key={idx} 
          className="text-warning-foreground font-black bg-warning/30 px-0.5 rounded-sm"
        >
          {op.charB}
        </span>
      );
    }
    return null;
  });

  return (
    <div className="flex items-center gap-2 text-xs md:text-sm font-medium mt-1 animate-in fade-in duration-200">
      <span className="px-1.5 py-0.5 rounded bg-destructive/10 text-destructive/70 line-through decoration-destructive/30 flex items-center">
        {userSpans}
      </span>
      <ArrowRight className="size-3 text-muted-foreground/30" />
      <span className="px-1.5 py-0.5 rounded bg-warning/20 text-warning-foreground font-bold animate-pulse flex items-center">
        {correctSpans}
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
  isVirtualKeyboardEnabled,
  onToggleVirtualKeyboard,
  status, 
  currentWord, 
  onShowHint, 
  onNext,
  lastUserInput,
  resultCorrectAnswer,
  isClose = false,
  diffCount = 0,
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
  activeKeyLetterIds,
  onReplay
}: SessionFeedbackProps) {
  const [isMounted, setIsMounted] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const isMobileDevice = isMounted && isMobile

  const renderVirtualKeyboardToggle = () => (
    <Button
      variant={isVirtualKeyboardEnabled ? "default" : "outline"}
      size="icon-lg"
      onPointerDown={(e) => e.preventDefault()}
      onClick={onToggleVirtualKeyboard}
    >
      <Keyboard className="size-4" />
    </Button>
  )

  if (status === "correct") {
    return (
      <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2 mt-2">
          <Button size="lg" onClick={onReplay} className="gap-1.5" variant="default">
            <Volume2 className="size-4" />
            Listen (R)
          </Button>
          <Button size="lg" onClick={onNext} className="gap-1.5" variant="default">
            <ArrowRight className="size-3.5" />
            <span>Next Word (<CornerDownLeft className="inline size-3" />)</span>
          </Button>
          {renderVirtualKeyboardToggle()}
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
        <div className="flex items-center gap-2 mt-2">
          <Button size="lg" onClick={onReplay} className="gap-1.5" variant="default">
            <Volume2 className="size-4" />
            Listen (R)
          </Button>
          <Button size="lg" onClick={onNext} className="gap-1.5" variant="default">
            <ArrowRight className="size-3.5" />
            <span>Next Word (<CornerDownLeft className="inline size-3" />)</span>
          </Button>
          {renderVirtualKeyboardToggle()}
        </div>
      </div>
    )
  }

  if (status === "incorrect") {
    return (
      <div className="flex flex-col items-center gap-2 animate-in fade-in duration-200">
        {isClose && (
          <div className="flex flex-col items-center gap-1 mb-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-warning">
              <AlertCircle className="size-4" />
              <span className="font-semibold text-sm">Close!</span>
            </div>
            <span className="text-xs md:text-sm text-warning font-medium">
              It differs by <strong className="font-extrabold">{diffCount} {diffCount === 1 ? 'letter' : 'letters'}</strong> from the correct answer.
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button variant="default" size="lg" onClick={onShowHint} className="gap-2">
            <Eye className="size-4" />
            <span>Show Hint (<CornerDownLeft className="inline size-3" />)</span>
          </Button>
          {renderVirtualKeyboardToggle()}
        </div>
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
            <Button variant="destructive" size="lg" onClick={onShowFinalAnswer} className="gap-2">
              <Eye className="size-4" />
              {isMobileDevice ? "Show Answer" : <span>Show Answer (<CornerDownLeft className="inline size-3" />)</span>}
            </Button>
          ) : (
            <Button 
              size="lg" 
              onClick={onSubmitJumbled} 
              className="gap-2"
              disabled={placedLetters.length !== jumbledLetters.length}
            >
              <Send className="size-4" />
              {isMobileDevice ? "Submit" : <span>Submit (<CornerDownLeft className="inline size-3" />)</span>}
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
          <strong className="text-foreground font-semibold tracking-wide">{currentWord.answer}</strong>
        </p>
        <div className="flex items-center gap-2">
          <Button size="lg" onClick={onReplay} className="gap-1.5" variant="default">
            <Volume2 className="size-4" />
            Listen (R)
          </Button>
          <Button size="lg" onClick={onNext} className="gap-1.5" variant="default">
            <ArrowRight className="size-3.5" />
            {isMobileDevice ? "Next Word" : <span>Next Word (<CornerDownLeft className="inline size-3" />)</span>}
          </Button>
          {renderVirtualKeyboardToggle()}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <Button 
          size="lg" 
          onClick={onSubmit} 
          disabled={status === "validating"}
          className="gap-2"
        >
          <Send className="size-4" />
          <span>Submit (<CornerDownLeft className="inline size-3" />)</span>
        </Button>
        {renderVirtualKeyboardToggle()}
      </div>
    </div>
  )
}
