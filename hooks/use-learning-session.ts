// hooks/use-learning-session.ts
import { useState, useCallback, useEffect, useRef } from "react"
import { verifyAnswer, fetchNextWord, getUserProgress, type WordItem } from "@/lib/api"

export type SessionStatus = "idle" | "validating" | "correct" | "incorrect" | "typo" | "hint" | "complete"

interface UseLearningSessionReturn {
  currentIndex: number
  currentWord: WordItem | null
  status: SessionStatus
  completedCount: number
  totalQuestions: number
  progressPercentage: number
  lastUserInput: string
  resultCorrectAnswer: string
  handleInputStart: () => void
  submitAnswer: (answer: string) => Promise<void>
  showHint: () => void
  moveToNext: () => void
  resetSession: () => void
}

export function useLearningSession(deckId: string, initialTotalQuestions: number): UseLearningSessionReturn {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(initialTotalQuestions)
  const [status, setStatus] = useState<SessionStatus>("idle")
  const [currentWord, setCurrentWord] = useState<WordItem | null>(null)
  const [lastUserInput, setLastUserInput] = useState("")
  const [resultCorrectAnswer, setResultCorrectAnswer] = useState("")
  const isMovingRef = useRef(false)

  const progressPercentage = Math.round((completedCount / totalQuestions) * 100)

  // Fetch initial word and progress on mount
  useEffect(() => {
    Promise.all([fetchNextWord(), getUserProgress()])
      .then(([word, progress]) => {
        if (word) {
          setCurrentWord(word)
        } else {
          setStatus("complete") // If backend buffer is empty
        }
        
        if (progress) {
          setCompletedCount(progress.dailyCompleted)
          setTotalQuestions(progress.dailyGoal)
        }
      })
      .catch(() => setStatus("complete"));
  }, [deckId])

  const handleInputStart = useCallback(() => {
    if (status === "incorrect") setStatus("idle")
  }, [status])

  const moveToNext = useCallback(async () => {
    if (isMovingRef.current) return

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }

    if (completedCount < totalQuestions) {
      isMovingRef.current = true
      setCurrentIndex((prev) => prev + 1)
      setStatus("validating")
      
      const nextWord = await fetchNextWord()
      if (nextWord) {
        setCurrentWord(nextWord)
        setStatus("idle")
      } else {
        // 백엔드에서 더 이상 가져올 문제가 없으면 완료
        setStatus("complete")
      }
      isMovingRef.current = false
    } else {
      setStatus("complete")
    }
  }, [completedCount, totalQuestions])

  const submitAnswer = useCallback(async (answer: string) => {
    if (!answer || status === "validating" || status === "correct" || status === "typo" || !currentWord) return

    setStatus("validating")
    setLastUserInput(answer)
    try {
      const result = await verifyAnswer(currentWord.id, answer)
      
      // 백엔드에서 실시간으로 계산된 풀은 개수와 목표 개수로 업데이트
      if (result.solvedCount !== undefined) setCompletedCount(result.solvedCount)
      if (result.targetCount !== undefined) setTotalQuestions(result.targetCount)

      if (result.isCorrect) {
        if (result.isTypo) {
          setStatus("typo")
          setResultCorrectAnswer(result.correctAnswer || currentWord.answer)
        } else {
          setStatus("correct")
        }
        
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel()
          
          const finalAnswer = result.isCorrect ? (result.correctAnswer || currentWord.answer) : currentWord.answer
          const fullSentence = currentWord.english.replace(/_+/g, finalAnswer)
          const utterance = new SpeechSynthesisUtterance(fullSentence)
          utterance.lang = "en-US"
          
          utterance.onend = () => moveToNext()
          utterance.onerror = () => moveToNext()
          
          window.speechSynthesis.speak(utterance)
        } else {
          setTimeout(() => moveToNext(), 1500)
        }
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
    setCurrentWord(null)
    
    Promise.all([fetchNextWord(), getUserProgress()])
      .then(([word, progress]) => {
        if (word) setCurrentWord(word)
        else setStatus("complete")
        
        if (progress) {
          setCompletedCount(progress.dailyCompleted)
          setTotalQuestions(progress.dailyGoal)
        }
      })
      .catch(() => setStatus("complete"))
  }, [deckId])

  return {
    currentIndex,
    currentWord,
    status,
    completedCount,
    totalQuestions,
    progressPercentage,
    lastUserInput,
    resultCorrectAnswer,
    handleInputStart,
    submitAnswer,
    showHint,
    moveToNext,
    resetSession,
  }
}
