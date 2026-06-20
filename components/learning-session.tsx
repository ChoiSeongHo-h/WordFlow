// components/learning-session.tsx
"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut"
import { useLearningSession, type JumbledLetter } from "@/hooks/use-learning-session"
import { SentenceInput } from "@/components/learning/sentence-input"
import { SessionFeedback } from "@/components/learning/session-feedback" 
import { SessionComplete } from "@/components/learning/session-complete"
import { VirtualKeyboard } from "@/components/learning/virtual-keyboard"

interface LearningSessionProps {
  deckId: string
  deckTitle: string
  totalQuestions: number
}

export function LearningSession({ deckId, deckTitle, totalQuestions }: LearningSessionProps) {
  const router = useRouter()
  const session = useLearningSession(deckId, totalQuestions)

  const [isKeyboardActive, setIsKeyboardActive] = useState(false)
  const [isVirtualKeyboardEnabled, setIsVirtualKeyboardEnabled] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("flow_use_virtual_keyboard")
      setIsVirtualKeyboardEnabled(saved === "true")
    }
  }, [])

  const handleToggleVirtualKeyboard = useCallback(() => {
    setIsVirtualKeyboardEnabled((prev) => {
      const next = !prev
      localStorage.setItem("flow_use_virtual_keyboard", String(next))
      return next
    })
  }, [])

  const handleVirtualKeyPress = useCallback((key: string) => {
    const input = inputRef.current
    if (!input) return

    const isReadOnly = session.status === "correct" || session.status === "typo" || session.status === "validating"

    if (key === "Enter") {
      if (session.status === "complete") {
        session.resetSession()
      } else if (session.status === "incorrect") {
        session.showHint()
      } else if (session.status === "show_answer" || session.status === "correct" || session.status === "typo") {
        session.moveToNext()
      } else {
        const trimmed = input.value.trim()
        if (trimmed) {
          session.submitAnswer(trimmed)
        }
      }
    } else if (key === "Clear") {
      if (!isReadOnly) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value"
        )?.set
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(input, "")
        } else {
          input.value = ""
        }
        
        input.dispatchEvent(new Event("input", { bubbles: true }))
        
        input.focus({ preventScroll: true })
      }
    } else if (key === "Backspace") {
      if (!isReadOnly) {
        const start = input.selectionStart ?? input.value.length
        const end = input.selectionEnd ?? input.value.length
        const val = input.value
        let newVal = val
        let newCursorPos = start

        if (start === end && start > 0) {
          newVal = val.substring(0, start - 1) + val.substring(end)
          newCursorPos = start - 1
        } else if (start !== end) {
          newVal = val.substring(0, start) + val.substring(end)
          newCursorPos = start
        }

        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value"
        )?.set
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(input, newVal)
        } else {
          input.value = newVal
        }
        
        input.dispatchEvent(new Event("input", { bubbles: true }))
        
        input.focus({ preventScroll: true })
        input.setSelectionRange(newCursorPos, newCursorPos)
      }
    } else if (key === "Space") {
      if (!isReadOnly) {
        const start = input.selectionStart ?? input.value.length
        const end = input.selectionEnd ?? input.value.length
        const val = input.value
        const newVal = val.substring(0, start) + " " + val.substring(end)
        const newCursorPos = start + 1

        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value"
        )?.set
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(input, newVal)
        } else {
          input.value = newVal
        }
        
        input.dispatchEvent(new Event("input", { bubbles: true }))
        
        input.focus({ preventScroll: true })
        input.setSelectionRange(newCursorPos, newCursorPos)
      }
    } else {
      if (!isReadOnly) {
        const char = key.toLowerCase()
        const start = input.selectionStart ?? input.value.length
        const end = input.selectionEnd ?? input.value.length
        const val = input.value
        const newVal = val.substring(0, start) + char + val.substring(end)
        const newCursorPos = start + 1

        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value"
        )?.set
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(input, newVal)
        } else {
          input.value = newVal
        }
        
        input.dispatchEvent(new Event("input", { bubbles: true }))
        
        input.focus({ preventScroll: true })
        input.setSelectionRange(newCursorPos, newCursorPos)
      }
    }
  }, [session])

  const showVirtualKeyboard = isVirtualKeyboardEnabled && 
    session.status !== "jumbled" && 
    session.status !== "jumbled_incorrect" && 
    session.status !== "complete"

  const isLayoutKeyboardActive = isKeyboardActive || showVirtualKeyboard

  // Drag-and-drop state
  const [activeDrag, setActiveDrag] = useState<{
    letter: JumbledLetter
    source: "pool" | "placed"
    startIndex: number | null
    width: number
    grabOffset: { x: number; y: number }
  } | null>(null)
  
  const [draggedLetterPos, setDraggedLetterPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [isOverPool, setIsOverPool] = useState(false)
  const [activeKeyLetterIds, setActiveKeyLetterIds] = useState<string[]>([])

  useEffect(() => {
    if (activeDrag && floatingRef.current) {
      floatingRef.current.style.transform = `translate3d(${draggedLetterPos.x}px, ${draggedLetterPos.y}px, 0)`
    }
  }, [activeDrag, draggedLetterPos])
  
  const dragStartInfoRef = useRef<{
    letter: JumbledLetter
    source: "pool" | "placed"
    index: number | null
    clientX: number
    clientY: number
    grabOffset: { x: number; y: number }
    width: number
  } | null>(null)
  
  const hasDraggedRef = useRef<boolean>(false)
  const placedContainerRef = useRef<HTMLDivElement | null>(null)
  const poolContainerRef = useRef<HTMLDivElement | null>(null)
  const floatingRef = useRef<HTMLDivElement | null>(null)

  // Keep ref to latest session state to avoid stale closures in global listeners
  const sessionRef = useRef(session)
  sessionRef.current = session

  const hoverIndexRef = useRef<number | null>(null)
  const isOverPoolRef = useRef<boolean>(false)
  const activeDragRef = useRef<any>(null)

  const handleGlobalPointerMove = useCallback((e: PointerEvent) => {
    const start = dragStartInfoRef.current
    if (!start) return
    
    const dx = e.clientX - start.clientX
    const dy = e.clientY - start.clientY
    
    if (!hasDraggedRef.current) {
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        hasDraggedRef.current = true
        const dragObj = {
          letter: start.letter,
          source: start.source,
          startIndex: start.index,
          width: start.width,
          grabOffset: start.grabOffset
        }
        activeDragRef.current = dragObj
        setActiveDrag(dragObj)
      }
    }
    
    if (hasDraggedRef.current) {
      const x = e.clientX - start.grabOffset.x
      const y = e.clientY - start.grabOffset.y
      if (floatingRef.current) {
        floatingRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
      }
      
      const placedRect = placedContainerRef.current?.getBoundingClientRect()
      const poolRect = poolContainerRef.current?.getBoundingClientRect()
      
      let overUnderline = false
      let overPool = false
      
      if (placedRect) {
        const verticalTolerance = 60
        const horizontalTolerance = 100
        const isYOver = e.clientY >= placedRect.top - verticalTolerance && e.clientY <= placedRect.bottom + verticalTolerance
        const isXOver = e.clientX >= placedRect.left - horizontalTolerance && e.clientX <= placedRect.right + horizontalTolerance
        
        if (isYOver && isXOver) {
          overUnderline = true
        }
      }
      
      if (poolRect) {
        const isYOver = e.clientY >= poolRect.top - 20 && e.clientY <= poolRect.bottom + 40
        if (isYOver) {
          overPool = true
        }
      } else {
        if (placedRect && e.clientY > placedRect.bottom + 40) {
          overPool = true
        }
      }
      
      if (overUnderline && placedContainerRef.current) {
        const container = placedContainerRef.current
        const children = Array.from(container.children) as HTMLElement[]
        
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
        
        hoverIndexRef.current = newHoverIndex
        setHoverIndex(newHoverIndex)
        isOverPoolRef.current = false
        setIsOverPool(false)
      } else {
        hoverIndexRef.current = null
        setHoverIndex(null)
        
        if (start.source === "placed" && (overPool || (placedRect && e.clientY > placedRect.bottom + 30))) {
          isOverPoolRef.current = true
          setIsOverPool(true)
        } else {
          isOverPoolRef.current = false
          setIsOverPool(false)
        }
      }
    }
  }, [])

  const handleGlobalPointerCancel = useCallback(() => {
    window.removeEventListener("pointermove", handleGlobalPointerMove)
    window.removeEventListener("pointerup", handleGlobalPointerUp)
    window.removeEventListener("pointercancel", handleGlobalPointerCancel)
    
    dragStartInfoRef.current = null
    activeDragRef.current = null
    setActiveDrag(null)
    hoverIndexRef.current = null
    setHoverIndex(null)
    isOverPoolRef.current = false
    setIsOverPool(false)
    
    setTimeout(() => {
      hasDraggedRef.current = false
    }, 50)
  }, [handleGlobalPointerMove])

  const handleGlobalPointerUp = useCallback((e: PointerEvent) => {
    window.removeEventListener("pointermove", handleGlobalPointerMove)
    window.removeEventListener("pointerup", handleGlobalPointerUp)
    window.removeEventListener("pointercancel", handleGlobalPointerCancel)
    
    const start = dragStartInfoRef.current
    if (!start) return
    
    const finalHoverIndex = hoverIndexRef.current
    const finalIsOverPool = isOverPoolRef.current
    const currentSession = sessionRef.current
    
    if (hasDraggedRef.current) {
      if (start.source === "pool") {
        if (finalHoverIndex !== null) {
          currentSession.addPlacedLetter(start.letter, finalHoverIndex)
        }
      } else if (start.source === "placed" && start.index !== null) {
        if (finalIsOverPool) {
          currentSession.removePlacedLetter(start.letter)
        } else if (finalHoverIndex !== null && finalHoverIndex !== start.index) {
          currentSession.reorderPlacedLetter(start.index, finalHoverIndex)
        }
      }
    }
    
    dragStartInfoRef.current = null
    activeDragRef.current = null
    setActiveDrag(null)
    hoverIndexRef.current = null
    setHoverIndex(null)
    isOverPoolRef.current = false
    setIsOverPool(false)
    
    setTimeout(() => {
      hasDraggedRef.current = false
    }, 50)
  }, [handleGlobalPointerMove, handleGlobalPointerCancel])

  const onDragStart = useCallback((
    e: React.PointerEvent<HTMLButtonElement>,
    letter: JumbledLetter,
    source: "pool" | "placed",
    index: number | null
  ) => {
    if (e.button !== 0) return
    
    e.preventDefault()
    
    const rect = e.currentTarget.getBoundingClientRect()
    const clientX = e.clientX
    const clientY = e.clientY
    const grabX = clientX - rect.left
    const grabY = clientY - rect.top
    
    dragStartInfoRef.current = {
      letter,
      source,
      index,
      clientX,
      clientY,
      grabOffset: { x: grabX, y: grabY },
      width: rect.width
    }
    hasDraggedRef.current = false
    
    setDraggedLetterPos({
      x: rect.left,
      y: rect.top
    })
    
    window.addEventListener("pointermove", handleGlobalPointerMove)
    window.addEventListener("pointerup", handleGlobalPointerUp)
    window.addEventListener("pointercancel", handleGlobalPointerCancel)
  }, [handleGlobalPointerMove, handleGlobalPointerUp, handleGlobalPointerCancel])

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handleGlobalPointerMove)
      window.removeEventListener("pointerup", handleGlobalPointerUp)
      window.removeEventListener("pointercancel", handleGlobalPointerCancel)
    }
  }, [handleGlobalPointerMove, handleGlobalPointerUp, handleGlobalPointerCancel])

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
        totalWords={session.totalQuestions} 
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

  const wordLength = session.currentWord?.answer?.length || 0
  let floatingSizeClasses = "h-9 text-lg px-2"
  if (wordLength >= 9) {
    floatingSizeClasses = "h-7.5 text-sm px-1 md:h-9 md:text-lg md:px-2"
  } else if (wordLength >= 7) {
    floatingSizeClasses = "h-8 text-base px-1.5 md:h-9 md:text-lg md:px-2"
  }

  return (
    <div 
      className="flex flex-col bg-background selection:bg-primary/20 overflow-hidden"
      style={{ height: "var(--visual-viewport-height, 100dvh)" }}
    >
      <Progress value={session.progressPercentage} className="fixed top-0 left-0 z-50 h-1 w-full rounded-none" />

      <header className={cn(
        "flex items-center justify-between px-4 md:px-8 transition-all duration-300",
        isLayoutKeyboardActive ? "py-1.5" : "py-3"
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
        isLayoutKeyboardActive ? "py-2" : "py-6 sm:py-0"
      )}>
        <div className={cn(
          "flex w-full max-w-3xl flex-col items-center transition-all duration-300",
          isLayoutKeyboardActive ? "gap-2" : "gap-4 sm:gap-6 md:gap-12"
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
                inputRef={inputRef}
                isVirtualKeyboardEnabled={isVirtualKeyboardEnabled}
                currentWord={session.currentWord}
                status={session.status}
                onInputChange={session.handleInputStart}
                onSubmit={session.submitAnswer}
                onHintRequest={session.showHint}
                onSkip={session.moveToNext}
                placedLetters={session.placedLetters}
                onRemoveLetter={session.removePlacedLetter}
                onReorderLetter={session.reorderPlacedLetter}
                jumbledLetters={session.jumbledLetters}
                onAddLetter={session.addPlacedLetter}
                activeDrag={activeDrag}
                hoverIndex={hoverIndex}
                isOverPool={isOverPool}
                onDragStart={onDragStart}
                hasDraggedRef={hasDraggedRef}
                placedContainerRef={placedContainerRef}
                activeKeyLetterIds={activeKeyLetterIds}
                setActiveKeyLetterIds={setActiveKeyLetterIds}
              />
            </div>
          )}

          {/* Feedback Area */}
          <div className={cn(
            "flex w-full flex-col items-center justify-start gap-3 relative transition-all duration-300",
            isLayoutKeyboardActive ? "min-h-[2.5rem]" : "min-h-[4.5rem] sm:min-h-[6rem]"
          )}>
            {session.currentWord && (
              <SessionFeedback 
                isVirtualKeyboardEnabled={isVirtualKeyboardEnabled}
                onToggleVirtualKeyboard={handleToggleVirtualKeyboard}
                status={session.status} 
                currentWord={session.currentWord} 
                onShowHint={session.showHint} 
                onNext={session.moveToNext} 
                lastUserInput={session.lastUserInput}
                resultCorrectAnswer={session.resultCorrectAnswer}
                isClose={session.isClose}
                diffCount={session.diffCount}
                jumbledLetters={session.jumbledLetters}
                placedLetters={session.placedLetters}
                onAddLetter={session.addPlacedLetter}
                onSubmitJumbled={session.submitJumbledAnswer}
                onShowFinalAnswer={session.showFinalAnswer}
                onSubmit={() => {
                  if (inputRef.current && inputRef.current.value.trim()) {
                    session.submitAnswer(inputRef.current.value.trim())
                  }
                }}
                activeDrag={activeDrag}
                onDragStart={onDragStart}
                hasDraggedRef={hasDraggedRef}
                poolContainerRef={poolContainerRef}
                activeKeyLetterIds={activeKeyLetterIds}
              />
            )}
          </div>
        </div>
      </main>

      {/* Virtual Keyboard */}
      {showVirtualKeyboard && (
        <VirtualKeyboard
          onKeyPress={handleVirtualKeyPress}
          status={session.status}
          disabled={session.status === "validating"}
        />
      )}

      {/* Floating Dragged Letter Indicator */}
      {activeDrag && (
        <div
          ref={floatingRef}
          data-dragging="true"
          className={cn(
            "fixed rounded-md font-bold flex items-center justify-center shadow-lg ring-2 select-none pointer-events-none z-50 transition-colors duration-200",
            floatingSizeClasses,
            isOverPool 
              ? "bg-destructive/90 text-destructive-foreground ring-destructive/30 scale-95 border-2 border-dashed border-destructive/50 opacity-70"
              : "bg-primary text-primary-foreground ring-primary/50"
          )}
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            transform: `translate3d(${draggedLetterPos.x}px, ${draggedLetterPos.y}px, 0)`,
            width: `${activeDrag.width}px`,
            willChange: "transform"
          }}
        >
          {activeDrag.letter.char === " " ? "\u00A0" : activeDrag.letter.char}
        </div>
      )}
    </div>
  )
}
