// hooks/use-learning-session.ts
import { useState, useCallback, useEffect } from "react"
import { verifyAnswer, saveProgressLocally, loadLocalProgress, type WordItem } from "@/lib/api"

// State Machine Definition for strict state management
export type SessionStatus = "idle" | "validating" | "correct" | "incorrect" | "hint" | "complete"

interface UseLearningSessionReturn {
  currentIndex: number
  currentWord: WordItem
  status: SessionStatus
  completedCount: number
  progressPercentage: number
  handleInputStart: () => void
  submitAnswer: (answer: string) => Promise<void>
  showHint: () => void
  moveToNext: () => void
  resetSession: () => void
}

export function useLearningSession(deckId: string, words: WordItem[]): UseLearningSessionReturn {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [status, setStatus] = useState<SessionStatus>("idle")

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

  // Transition: Reset to idle when user starts typing again
  const handleInputStart = useCallback(() => {
    if (status === "incorrect") setStatus("idle")
  }, [status])

  const moveToNext = useCallback(() => {
    if (currentIndex < words.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      setStatus("idle")
      saveProgressLocally(deckId, nextIndex, completedCount)
    } else {
      setStatus("complete")
      saveProgressLocally(deckId, 0, 0)
    }
  }, [currentIndex, words.length, deckId, completedCount])

  const submitAnswer = useCallback(async (answer: string) => {
    if (!answer || status === "validating" || status === "correct") return

    setStatus("validating")
    try {
      const result = await verifyAnswer(currentWord.id, answer)
      if (result.isCorrect) {
        setStatus("correct")
        setCompletedCount((prev) => prev + 1)
        // Auto-advance on correct answer
        setTimeout(() => moveToNext(), 600)
      } else {
        setStatus("incorrect")
      }
    } catch (error) {
      console.error("Verification failed", error)
      setStatus("idle") // Fallback on error
    }
  }, [currentWord.id, status, moveToNext])

  const showHint = useCallback(() => {
    if (status === "incorrect") setStatus("hint")
  }, [status])

  const resetSession = useCallback(() => {
    setCurrentIndex(0)
    setStatus("idle")
    setCompletedCount(0)
  }, [])

  return {
    currentIndex,
    currentWord,
    status,
    completedCount,
    progressPercentage,
    handleInputStart,
    submitAnswer,
    showHint,
    moveToNext,
    resetSession,
  }
}