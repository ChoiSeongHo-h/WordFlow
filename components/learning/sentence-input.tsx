// components/learning/sentence-input.tsx
"use client"

import { useRef, useEffect, useCallback, useState } from "react"
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
  onReorderLetter?: (fromIndex: number, toIndex: number) => void
  jumbledLetters?: JumbledLetter[]
  onAddLetter?: (letter: JumbledLetter) => void
  activeDrag: {
    letter: JumbledLetter
    source: "pool" | "placed"
    startIndex: number | null
    width: number
    grabOffset: { x: number; y: number }
  } | null
  hoverIndex: number | null
  isOverPool: boolean
  onDragStart: (
    e: React.PointerEvent<HTMLButtonElement>,
    letter: JumbledLetter,
    source: "pool" | "placed",
    index: number | null
  ) => void
  hasDraggedRef: React.RefObject<boolean>
  placedContainerRef: React.RefObject<HTMLDivElement | null>
  activeKeyLetterIds: string[]
  setActiveKeyLetterIds: React.Dispatch<React.SetStateAction<string[]>>
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
  onReorderLetter,
  jumbledLetters = [],
  onAddLetter,
  activeDrag,
  hoverIndex,
  isOverPool,
  onDragStart,
  hasDraggedRef,
  placedContainerRef,
  activeKeyLetterIds,
  setActiveKeyLetterIds
}: SentenceInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const spanRef = useRef<HTMLSpanElement>(null)
  const jumbledRef = useRef<HTMLDivElement>(null)
  const pendingLetterRef = useRef<JumbledLetter | null>(null)
  const pendingTimeoutsRef = useRef<NodeJS.Timeout[]>([])

  useEffect(() => {
    return () => {
      pendingTimeoutsRef.current.forEach(clearTimeout)
    }
  }, [])

  const isJumbledMode = status === "jumbled" || status === "jumbled_incorrect" || status === "show_answer"

  // Dynamic sizing based on word length to prevent overflow on mobile (only on screens < 768px)
  const wordLength = currentWord?.answer?.length || 0
  let sizeClasses = "h-9 min-w-[2.25rem] text-lg px-2"
  let containerGapClass = "gap-1.5"
  if (wordLength >= 9) {
    sizeClasses = "h-7.5 min-w-[1.5rem] text-sm px-1 md:h-9 md:min-w-[2.25rem] md:text-lg md:px-2"
    containerGapClass = "gap-0.5 md:gap-1.5"
  } else if (wordLength >= 7) {
    sizeClasses = "h-8 min-w-[1.875rem] text-base px-1.5 md:h-9 md:min-w-[2.25rem] md:text-lg md:px-2"
    containerGapClass = "gap-1 md:gap-1.5"
  }

  // Calculate visual order of elements via Flexbox 'order' property to prevent DOM node reordering during drag
  const getLetterOrder = (index: number) => {
    if (!activeDrag || hoverIndex === null) return index

    if (activeDrag.source === "placed" && activeDrag.startIndex !== null) {
      const draggedIdx = activeDrag.startIndex
      if (index === draggedIdx) return hoverIndex
      
      if (draggedIdx < hoverIndex) {
        if (index > draggedIdx && index <= hoverIndex) {
          return index - 1
        }
      } else if (draggedIdx > hoverIndex) {
        if (index >= hoverIndex && index < draggedIdx) {
          return index + 1
        }
      }
    } else if (activeDrag.source === "pool") {
      if (index >= hoverIndex) {
        return index + 1
      }
    }
    return index
  }

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
        inputRef.current.focus({ preventScroll: true })
      } else if (status === "correct" && currentWord) {
        if (placedLetters.length > 0 || !inputRef.current.value) {
          // Fix for returning from Jumbled Mode to standard display
          inputRef.current.value = currentWord.answer
          updateInputWidth(currentWord.answer)
        }
      }
    }
  }, [currentWord, status, updateInputWidth, placedLetters])

  useEffect(() => {
    if (isJumbledMode && jumbledRef.current) {
      if (status === "show_answer") {
        if (spanRef.current) {
          spanRef.current.textContent = currentWord?.answer || ""
          const width = Math.max(64, spanRef.current.offsetWidth + 16)
          jumbledRef.current.style.width = `${width}px`
        }
      } else if (placedContainerRef.current) {
        const innerWidth = placedContainerRef.current.offsetWidth
        const targetWidth = Math.max(64, innerWidth)
        jumbledRef.current.style.width = `${targetWidth}px`
      }
    }
  }, [placedLetters, isJumbledMode, status, currentWord])

  useEffect(() => {
    if (isJumbledMode && status !== "show_answer") {
      jumbledRef.current?.focus({ preventScroll: true })
    }
  }, [isJumbledMode, status, placedLetters]) // Ensure refocus after adding/removing letters

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateInputWidth(e.target.value)
    onInputChange()
  }

  const handleJumbledBlur = (e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node) && isJumbledMode && status !== "show_answer") {
      setTimeout(() => jumbledRef.current?.focus({ preventScroll: true }), 10)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (status === "validating") return

      if (status === "correct" || status === "typo" || isJumbledMode) {
        onSkip()
      } else if (status === "incorrect") {
        onHintRequest()
      } else {
        onSubmit(inputRef.current?.value.trim() || "")
      }
    }
  }

  const handleBlur = () => {
    if (status !== "complete" && !isJumbledMode) {
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 10)
    }
  }

  const parts = currentWord.english.split("___")
  if (parts.length < 2) return <span className="text-foreground">{currentWord.english}</span>

  return (
    <span className="inline leading-relaxed m-0 p-0 text-foreground/40 font-medium tracking-wide transition-colors duration-300 focus-within:text-foreground/70 select-none">
      <span className="text-foreground/90">{parts[0]}</span>
      <span className="relative inline-block align-baseline mx-1">
        <span 
          ref={spanRef} 
          className="absolute left-0 top-0 -z-10 opacity-0 whitespace-pre text-xl sm:text-2xl md:text-3xl font-bold pointer-events-none" 
          aria-hidden="true"
        >
          {currentWord.answer}
        </span>
        
        {isJumbledMode && (
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
                if (available) {
                  // Place the letter immediately (zero latency, zero dropped keys)
                  onAddLetter?.(available)
                  
                  // Highlight in the pool for 150ms
                  setActiveKeyLetterIds(prev => [...prev, available.id])
                  const t = setTimeout(() => {
                    setActiveKeyLetterIds(prev => prev.filter(id => id !== available.id))
                    pendingTimeoutsRef.current = pendingTimeoutsRef.current.filter(x => x !== t)
                  }, 150)
                  pendingTimeoutsRef.current.push(t)
                }
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
              <div ref={placedContainerRef} className={cn("flex min-h-[2.25rem] items-center w-max", containerGapClass)}>
                {placedLetters.map((letter, index) => {
                  const isDragging = activeDrag && activeDrag.source === "placed" && activeDrag.startIndex === index
                  const visualOrder = getLetterOrder(index)
                  
                  if (isDragging) {
                    return (
                      <button
                        key={letter.id}
                        data-placeholder="true"
                        className={cn(
                          "border-2 border-dashed border-primary/40 bg-primary/5 rounded-md text-transparent select-none touch-none cursor-grabbing animate-pulse transition-all duration-200",
                          sizeClasses,
                          isOverPool && "w-0 opacity-0 px-0 border-0 overflow-hidden mx-0"
                        )}
                        style={{ 
                          width: isOverPool ? "0px" : `${activeDrag.width}px`,
                          order: visualOrder,
                          viewTransitionName: `letter-${letter.id}`
                        } as React.CSSProperties}
                      >
                        &nbsp;
                      </button>
                    )
                  }

                  return (
                    <button
                      key={letter.id}
                      onPointerDown={(e) => onDragStart(e, letter, "placed", index)}
                      onClick={(e) => {
                        if (hasDraggedRef.current) {
                          e.preventDefault()
                          return
                        }
                        onRemoveLetter?.(letter)
                      }}
                      className={cn(
                        "rounded-md bg-secondary text-secondary-foreground font-bold transition-all hover:bg-secondary/80 active:bg-primary active:text-primary-foreground active:scale-95 duration-100 select-none touch-none cursor-grab",
                        sizeClasses,
                        letter.char === " " && "bg-muted/50"
                      )}
                      style={{ 
                        order: visualOrder,
                        viewTransitionName: `letter-${letter.id}` 
                      } as React.CSSProperties}
                    >
                      {letter.char === " " ? "\u00A0" : letter.char}
                    </button>
                  )
                })}
                {placedLetters.length === 0 && !(activeDrag && activeDrag.source === "pool" && hoverIndex !== null) && (
                  <span className="text-muted-foreground/20">...</span>
                )}

                {/* Insertion Placeholder from Pool Drag */}
                {activeDrag && activeDrag.source === "pool" && hoverIndex !== null && (
                  <button
                    data-placeholder="true"
                    className={cn(
                      "border-2 border-dashed border-primary/40 bg-primary/5 rounded-md text-transparent select-none touch-none cursor-grabbing animate-pulse",
                      sizeClasses
                    )}
                    style={{ 
                      width: `${activeDrag.width}px`,
                      order: hoverIndex,
                      viewTransitionName: `letter-placeholder`
                    } as React.CSSProperties}
                  >
                    &nbsp;
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          readOnly={status === "correct" || status === "typo" || status === "validating"}
          className={cn(
            "inline-block bg-transparent text-center text-xl sm:text-2xl md:text-3xl font-semibold outline-none transition-all duration-300",
            "border-b-2 placeholder:text-transparent w-16",
            status === "idle" && "border-muted-foreground/30 focus:border-primary text-primary",
            status === "correct" && "border-success text-success animate-spring-pop",
            status === "typo" && "border-warning text-warning animate-spring-pop",
            status === "incorrect" && "border-destructive text-destructive animate-shake",
            status === "validating" && "opacity-50",
            isJumbledMode && "absolute opacity-0 pointer-events-none w-0 h-0 p-0 border-0"
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
