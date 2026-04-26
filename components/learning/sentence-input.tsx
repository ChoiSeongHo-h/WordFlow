// components/learning/sentence-input.tsx
"use client"

import { useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import type { WordItem } from "@/lib/api"
import type { SessionStatus } from "@/hooks/use-learning-session"

interface SentenceInputProps {
  currentWord: WordItem
  status: SessionStatus
  onInputChange: () => void
  onSubmit: (val: string) => void
  onHintRequest: () => void
  onSkip: () => void
}

export function SentenceInput({
  currentWord,
  status,
  onInputChange,
  onSubmit,
  onHintRequest,
  onSkip
}: SentenceInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const spanRef = useRef<HTMLSpanElement>(null)

  // Zero-Latency Width Calculation
  const updateInputWidth = useCallback((value: string) => {
    if (spanRef.current && inputRef.current) {
      spanRef.current.textContent = value || currentWord?.answer || ""
      const width = Math.max(64, spanRef.current.offsetWidth + 16) // 64px = w-16
      inputRef.current.style.width = `${width}px`
    }
  }, [currentWord])

  useEffect(() => {
    if (inputRef.current && status === "idle") {
      inputRef.current.value = ""
      updateInputWidth("")
      inputRef.current.focus()
    }
  }, [currentWord, status, updateInputWidth])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateInputWidth(e.target.value)
    onInputChange()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (status === "validating") return

      if (status === "correct" || status === "hint") {
        onSkip()
      } else if (status === "incorrect") {
        onHintRequest()
      } else {
        onSubmit(inputRef.current?.value.trim() || "")
      }
    }
  }

  const handleBlur = () => {
    if (status !== "complete" && status !== "validating" && status !== "hint" && status !== "correct") {
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
      </span>
      <span className="text-foreground/90">{parts[1]}</span>
    </span>
  )
}