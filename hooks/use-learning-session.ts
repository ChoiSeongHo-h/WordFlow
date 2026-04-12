// hooks/use-learning-session.ts
import { useState, useCallback, useEffect } from "react"
import { verifyAnswer, fetchNextWord, type WordItem } from "@/lib/api"

export type SessionStatus = "idle" | "validating" | "correct" | "incorrect" | "hint" | "complete"

interface UseLearningSessionReturn {
  currentIndex: number
  currentWord: WordItem | null
  status: SessionStatus
  completedCount: number
  progressPercentage: number
  handleInputStart: () => void
  submitAnswer: (answer: string) => Promise<void>
  showHint: () => void
  moveToNext: () => void
  resetSession: () => void
}

export function useLearningSession(deckId: string, totalQuestions: number): UseLearningSessionReturn {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [status, setStatus] = useState<SessionStatus>("idle")
  const [currentWord, setCurrentWord] = useState<WordItem | null>(null)

  const progressPercentage = Math.round((currentIndex / totalQuestions) * 100)

  // Fetch initial word on mount
  useEffect(() => {
    fetchNextWord().then(word => {
      if (word) {
        setCurrentWord(word)
      } else {
        setStatus("complete") // If backend buffer is empty
      }
    }).catch(() => setStatus("complete"));
  }, [deckId])

  const handleInputStart = useCallback(() => {
    if (status === "incorrect") setStatus("idle")
  }, [status])

  const moveToNext = useCallback(async () => {
    if (currentIndex < totalQuestions - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      setStatus("validating")
      
      const nextWord = await fetchNextWord()
      if (nextWord) {
        setCurrentWord(nextWord)
        setStatus("idle")
      } else {
        setStatus("complete")
      }
    } else {
      setStatus("complete")
    }
  }, [currentIndex, totalQuestions])

  const submitAnswer = useCallback(async (answer: string) => {
    if (!answer || status === "validating" || status === "correct" || !currentWord) return

    setStatus("validating")
    try {
      const result = await verifyAnswer(currentWord.id, answer)
      if (result.isCorrect) {
        setStatus("correct")
        setCompletedCount((prev) => prev + 1)
        setTimeout(() => moveToNext(), 600)
      } else {
        setStatus("incorrect")
      }
    } catch (error) {
      console.error("Verification failed", error)
      setStatus("idle") 
    }
  }, [currentWord, status, moveToNext])

  const showHint = useCallback(() => {
    if (status === "incorrect") setStatus("hint")
  }, [status])

  const resetSession = useCallback(() => {
    setCurrentIndex(0)
    setStatus("idle")
    setCompletedCount(0)
    setCurrentWord(null)
    fetchNextWord().then(word => {
      if (word) setCurrentWord(word)
      else setStatus("complete")
    })
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
