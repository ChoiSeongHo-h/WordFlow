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
  onAddLetter
}: SentenceInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const spanRef = useRef<HTMLSpanElement>(null)
  const jumbledRef = useRef<HTMLDivElement>(null)
  const jumbledInnerRef = useRef<HTMLDivElement>(null)

  const isJumbledMode = status === "jumbled" || status === "jumbled_incorrect" || status === "show_answer"

  // Pointer Events drag-and-drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [draggedLetterPos, setDraggedLetterPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [draggedLetterWidth, setDraggedLetterWidth] = useState<number>(0)

  const dragPointerIdRef = useRef<number | null>(null)
  const pendingDragIndexRef = useRef<number | null>(null)
  const dragStartCoordsRef = useRef<{ x: number; y: number } | null>(null)
  const dragGrabOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const hasDraggedRef = useRef<boolean>(false)

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>, index: number) => {
    if (e.button !== 0) return // Only primary click
    e.currentTarget.setPointerCapture(e.pointerId)
    
    const rect = e.currentTarget.getBoundingClientRect()
    dragPointerIdRef.current = e.pointerId
    pendingDragIndexRef.current = index
    dragStartCoordsRef.current = { x: e.clientX, y: e.clientY }
    dragGrabOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    hasDraggedRef.current = false
    
    setDraggedLetterWidth(rect.width)
    setDraggedLetterPos({ x: rect.left, y: rect.top })
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>, index: number) => {
    if (pendingDragIndexRef.current === null || dragPointerIdRef.current !== e.pointerId) return
    
    const dx = e.clientX - dragStartCoordsRef.current!.x
    const dy = e.clientY - dragStartCoordsRef.current!.y
    
    // Start drag flow only when user moves past the 5px threshold
    if (!hasDraggedRef.current) {
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        hasDraggedRef.current = true
        setDraggedIndex(pendingDragIndexRef.current)
        setHoverIndex(pendingDragIndexRef.current)
      }
    }

    if (hasDraggedRef.current && pendingDragIndexRef.current !== null) {
      // Update floating position to follow pointer
      setDraggedLetterPos({
        x: e.clientX - dragGrabOffsetRef.current.x,
        y: e.clientY - dragGrabOffsetRef.current.y
      })

      const container = jumbledInnerRef.current
      if (!container) return

      const children = Array.from(container.children) as HTMLElement[]
      // Filter out placeholder and floating items to get actual letter button rects
      const normalButtons = children.filter(
        child => child.tagName === "BUTTON" && !child.dataset.placeholder && !child.dataset.dragging
      )
      const rects = normalButtons.map(child => child.getBoundingClientRect())

      let newHoverIndex = 0
      for (let i = 0; i < rects.length; i++) {
        const rect = rects[i]
        const midpoint = rect.left + rect.width / 2
        if (e.clientX > midpoint) {
          newHoverIndex = i + 1
        }
      }

      if (hoverIndex !== newHoverIndex) {
        setHoverIndex(newHoverIndex)
      }
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>, index: number) => {
    if (dragPointerIdRef.current === e.pointerId) {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
      
      if (hasDraggedRef.current && hoverIndex !== null && draggedIndex !== null && draggedIndex !== hoverIndex) {
        onReorderLetter?.(draggedIndex, hoverIndex)
      }
      
      // Delay resetting hasDraggedRef slightly to let the synchronous click event read it first,
      // preventing accessibility bugs for keyboard actions.
      setTimeout(() => {
        hasDraggedRef.current = false
      }, 50)
      
      dragPointerIdRef.current = null
      pendingDragIndexRef.current = null
      dragStartCoordsRef.current = null
      setDraggedIndex(null)
      setHoverIndex(null)
    }
  }

  const handlePointerCancel = () => {
    dragPointerIdRef.current = null
    pendingDragIndexRef.current = null
    dragStartCoordsRef.current = null
    setDraggedIndex(null)
    setHoverIndex(null)
  }

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
    if (draggedIndex === null || hoverIndex === null) return index
    if (index === draggedIndex) return hoverIndex
    
    if (draggedIndex < hoverIndex) {
      if (index > draggedIndex && index <= hoverIndex) {
        return index - 1
      }
    } else if (draggedIndex > hoverIndex) {
      if (index >= hoverIndex && index < draggedIndex) {
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
      } else if (jumbledInnerRef.current) {
        const innerWidth = jumbledInnerRef.current.offsetWidth
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
              <div ref={jumbledInnerRef} className={cn("flex min-h-[2.25rem] items-center w-max", containerGapClass)}>
                {placedLetters.map((letter, index) => {
                  const isDragging = draggedIndex === index
                  const visualOrder = getLetterOrder(index)
                  
                  if (isDragging) {
                    return (
                      <button
                        key={letter.id}
                        data-placeholder="true"
                        onPointerMove={(e) => handlePointerMove(e, index)}
                        onPointerUp={(e) => handlePointerUp(e, index)}
                        onPointerCancel={handlePointerCancel}
                        onLostPointerCapture={handlePointerCancel}
                        className={cn(
                          "border-2 border-dashed border-primary/40 bg-primary/5 rounded-md text-transparent select-none touch-none cursor-grabbing animate-pulse",
                          sizeClasses
                        )}
                        style={{ 
                          width: `${draggedLetterWidth}px`,
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
                      onPointerDown={(e) => handlePointerDown(e, index)}
                      onPointerMove={(e) => handlePointerMove(e, index)}
                      onPointerUp={(e) => handlePointerUp(e, index)}
                      onPointerCancel={handlePointerCancel}
                      onLostPointerCapture={handlePointerCancel}
                      onClick={(e) => {
                        if (hasDraggedRef.current) {
                          e.preventDefault()
                          return
                        }
                        onRemoveLetter?.(letter)
                      }}
                      className={cn(
                        "rounded-md bg-secondary text-secondary-foreground font-bold transition-all hover:bg-secondary/80 select-none touch-none cursor-grab",
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
                {placedLetters.length === 0 && <span className="text-muted-foreground/20">...</span>}

                {/* Floating Dragged Letter Indicator */}
                {draggedIndex !== null && (
                  <div
                    data-dragging="true"
                    className={cn(
                      "fixed rounded-md bg-primary text-primary-foreground font-bold flex items-center justify-center shadow-lg ring-2 ring-primary/50 cursor-grabbing select-none pointer-events-none z-50",
                      sizeClasses
                    )}
                    style={{
                      left: `${draggedLetterPos.x}px`,
                      top: `${draggedLetterPos.y}px`,
                      width: `${draggedLetterWidth}px`
                    }}
                  >
                    {placedLetters[draggedIndex].char === " " ? "\u00A0" : placedLetters[draggedIndex].char}
                  </div>
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
