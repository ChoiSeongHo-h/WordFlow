// components/learning/sentence-input.tsx
"use client"

import { useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import type { WordItem } from "@/lib/api"
import type { SessionStatus, JumbledLetter } from "@/hooks/use-learning-session"

interface SentenceInputProps {
  currentWord: WordItem
  status: SessionStatus
  onInputChange: () => void
  onSubmit: (val: string) => void
  onHintRequest: () => void
  onSkip: () => void
  placedLetters?: JumbledLetter[]
  onRemoveLetter?: (letter: JumbledLetter) => void
  jumbledLetters?: JumbledLetter[]
  onAddLetter?: (letter: JumbledLetter) => void
}

export function SentenceInput({
  currentWord,
  status,
  onInputChange,
  onSubmit,
  onHintRequest,
  onSkip,
  placedLetters = [],
  onRemoveLetter,
  jumbledLetters = [],
  onAddLetter
}: SentenceInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const spanRef = useRef<HTMLSpanElement>(null)
  const jumbledRef = useRef<HTMLDivElement>(null)
  const jumbledInnerRef = useRef<HTMLDivElement>(null)

  const isJumbledMode = status === "jumbled" || status === "jumbled_incorrect" || status === "show_answer"

  // Zero-Latency Width Calculation
  const updateInputWidth = useCallback((value: string) => {
    if (spanRef.current && inputRef.current) {
      spanRef.current.textContent = value || currentWord?.answer || ""
      const width = Math.max(64, spanRef.current.offsetWidth + 16) // 64px = w-16
      inputRef.current.style.width = `${width}px`
    }
  }, [currentWord])

  useEffect(() => {
    if (inputRef.current) {
      if (status === "idle") {
        inputRef.current.value = ""
        updateInputWidth("")
        inputRef.current.focus()
      } else if (status === "correct" && !inputRef.current.value && currentWord) {
        // Fix for returning from Jumbled Mode to standard display
        inputRef.current.value = currentWord.answer
        updateInputWidth(currentWord.answer)
      }
    }
  }, [currentWord, status, updateInputWidth])

  useEffect(() => {
    if (isJumbledMode && jumbledRef.current) {
      if (status === "show_answer") {
        if (spanRef.current) {
          spanRef.current.textContent = currentWord?.answer || ""
          const width = Math.max(64, spanRef.current.offsetWidth + 16)
          jumbledRef.current.style.width = `${width}px`
        }
      } else if (jumbledInnerRef.current) {
        const innerWidth = jumbledInnerRef.current.offsetWidth
        const targetWidth = Math.max(64, innerWidth)
        jumbledRef.current.style.width = `${targetWidth}px`
      }
    }
  }, [placedLetters, isJumbledMode, status, currentWord])

  useEffect(() => {
    if (isJumbledMode && status !== "show_answer") {
      jumbledRef.current?.focus()
    }
  }, [isJumbledMode, status, placedLetters]) // Ensure refocus after adding/removing letters

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateInputWidth(e.target.value)
    onInputChange()
  }

  const handleJumbledBlur = (e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node) && isJumbledMode && status !== "show_answer") {
      setTimeout(() => jumbledRef.current?.focus(), 10)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (status === "validating") return

      if (status === "correct" || isJumbledMode) {
        onSkip()
      } else if (status === "incorrect") {
        onHintRequest()
      } else {
        onSubmit(inputRef.current?.value.trim() || "")
      }
    }
  }

  const handleBlur = () => {
    if (status !== "complete" && status !== "validating" && !isJumbledMode && status !== "correct") {
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }

  const parts = currentWord.english.split("___")
  if (parts.length < 2) return <span className="text-foreground">{currentWord.english}</span>

  return (
    <span className="inline leading-relaxed m-0 p-0 text-foreground/40 font-medium tracking-wide transition-colors duration-300 focus-within:text-foreground/70">
      <span className="text-foreground/90">{parts[0]}</span>
      <span className="relative inline-block align-baseline mx-1">
        <span 
          ref={spanRef} 
          className="absolute left-0 top-0 -z-10 opacity-0 whitespace-pre text-2xl md:text-3xl font-bold pointer-events-none" 
          aria-hidden="true"
        >
          {currentWord.answer}
        </span>
        
        {isJumbledMode ? (
          <div 
            ref={jumbledRef}
            tabIndex={0}
            onBlur={handleJumbledBlur}
            onKeyDown={(e) => {
              if (status === "show_answer") return
              
              if (e.key === "Backspace") {
                if (placedLetters.length > 0) {
                  onRemoveLetter?.(placedLetters[placedLetters.length - 1])
                }
              } else if (e.key.length === 1 && /[a-zA-Z\s]/.test(e.key)) {
                const char = e.key.toLowerCase()
                const available = jumbledLetters?.find(
                  jl => jl.char.toLowerCase() === char && !placedLetters.some(pl => pl.id === jl.id)
                )
                if (available) onAddLetter?.(available)
              }
            }}
            className={cn(
              "inline-flex items-center justify-center border-b-2 py-1 transition-all duration-300 outline-none",
              status === "jumbled" && "border-primary",
              status === "jumbled_incorrect" && "border-destructive animate-shake",
              status === "show_answer" && "border-muted-foreground/30"
            )}
            style={{ willChange: "width" }}
          >
            {status === "show_answer" ? (
              <span className="text-foreground font-semibold">{currentWord.answer}</span>
            ) : (
              <div ref={jumbledInnerRef} className="flex gap-1.5 min-h-[2.25rem] items-center w-max">
                {placedLetters.map((letter) => (
                  <button
                    key={letter.id}
                    onClick={() => onRemoveLetter?.(letter)}
                    className={cn(
                      "h-9 min-w-[2.25rem] px-2 rounded-md bg-secondary text-secondary-foreground font-bold text-lg transition-all hover:bg-secondary/80",
                      letter.char === " " && "bg-muted/50"
                    )}
                    style={{ viewTransitionName: `letter-${letter.id}` } as React.CSSProperties}
                  >
                    {letter.char === " " ? "\u00A0" : letter.char}
                  </button>
                ))}
                {placedLetters.length === 0 && <span className="text-muted-foreground/20">...</span>}
              </div>
            )}
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            disabled={status === "correct" || status === "typo" || status === "validating"}
            className={cn(
              "inline-block bg-transparent text-center text-2xl md:text-3xl font-semibold outline-none transition-all duration-300",
              "border-b-2 placeholder:text-transparent w-16",
              status === "idle" && "border-muted-foreground/30 focus:border-primary text-primary",
              status === "correct" && "border-success text-success animate-spring-pop",
              status === "typo" && "border-warning text-warning animate-spring-pop",
              status === "incorrect" && "border-destructive text-destructive animate-shake",
              status === "validating" && "opacity-50"
            )}
            style={{ willChange: "width, transform" }}
            autoComplete="off"
            spellCheck="false"
            autoFocus
          />
        )}
      </span>
      <span className="text-foreground/90">{parts[1]}</span>
    </span>
  )
}
