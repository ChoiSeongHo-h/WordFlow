// hooks/use-learning-session.ts
import { useState, useCallback, useEffect, useRef } from "react"
import { verifyAnswer, fetchNextWord, getUserProgress, startSession, type WordItem } from "@/lib/api"

export type SessionStatus = "idle" | "validating" | "correct" | "incorrect" | "typo" | "jumbled" | "jumbled_incorrect" | "show_answer" | "complete"

export interface JumbledLetter {
  id: string
  char: string
}

interface UseLearningSessionReturn {
  currentIndex: number
  currentWord: WordItem | null
  status: SessionStatus
  completedCount: number
  totalQuestions: number
  progressPercentage: number
  lastUserInput: string
  resultCorrectAnswer: string
  jumbledLetters: JumbledLetter[]
  placedLetters: JumbledLetter[]
  handleInputStart: () => void
  submitAnswer: (answer: string) => Promise<void>
  showHint: () => void // This will now trigger jumbled mode
  addPlacedLetter: (letter: JumbledLetter, index?: number) => void
  removePlacedLetter: (letter: JumbledLetter) => void
  reorderPlacedLetter: (fromIndex: number, toIndex: number) => void
  submitJumbledAnswer: () => void
  showFinalAnswer: () => void
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
  const [jumbledLetters, setJumbledLetters] = useState<JumbledLetter[]>([])
  const [placedLetters, setPlacedLetters] = useState<JumbledLetter[]>([])
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

    if (typeof document !== "undefined") {
      const inputEl = document.querySelector('input')
      if (inputEl) {
        inputEl.focus()
      }
    }

    if (completedCount < totalQuestions) {
      isMovingRef.current = true
      setCurrentIndex((prev) => prev + 1)
      setStatus("validating")
      
      const nextWord = await fetchNextWord()
      if (nextWord) {
        setCurrentWord(nextWord)
        setJumbledLetters([])
        setPlacedLetters([])
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

  const playSpeechAndMoveToNext = useCallback((answerText: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()

      if (!currentWord) {
        moveToNext()
        return
      }

      let userEmail = "guest"
      try {
        const token = localStorage.getItem("flow_token")
        if (token) {
          const base64Url = token.split('.')[1]
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
          const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))
          const payload = JSON.parse(jsonPayload)
          userEmail = payload.sub || "guest"
        }
      } catch (e) {
        console.error("Failed to decode token", e)
      }

      const speedKey = `wordflow-voice-speed-${userEmail}`
      const voiceKey = `wordflow-voice-uri-${userEmail}`
      const savedSpeed = localStorage.getItem(speedKey)
      const savedVoiceURI = localStorage.getItem(voiceKey)

      const rate = savedSpeed ? parseFloat(savedSpeed) : 1.0
      const fullSentence = currentWord.english.replace(/_+/g, answerText)
      const utterance = new SpeechSynthesisUtterance(fullSentence)
      utterance.lang = "en-US"
      utterance.rate = rate

      if (savedVoiceURI && savedVoiceURI !== "system-default") {
        const voices = window.speechSynthesis.getVoices()
        const selectedVoice = voices.find(v => v.voiceURI === savedVoiceURI)
        if (selectedVoice) {
          utterance.voice = selectedVoice
        }
      }

      let finished = false
      const handleFinish = () => {
        if (!finished) {
          finished = true
          moveToNext()
        }
      }

      const speechTimeout = setTimeout(() => {
        handleFinish()
      }, 8000)

      utterance.onend = () => {
        clearTimeout(speechTimeout)
        handleFinish()
      }
      utterance.onerror = () => {
        clearTimeout(speechTimeout)
        handleFinish()
      }

      window.speechSynthesis.speak(utterance)
    } else {
      setTimeout(() => moveToNext(), 1500)
    }
  }, [currentWord, moveToNext])

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
        
        const finalAnswer = result.correctAnswer || currentWord.answer
        playSpeechAndMoveToNext(finalAnswer)
      } else {
        setStatus("incorrect")
      }
    } catch (error) {
      console.error("Verification failed", error)
      setStatus("idle") 
    }
  }, [currentWord, status, playSpeechAndMoveToNext])

  const showHint = useCallback(() => {
    if (status === "incorrect" && currentWord) {
      const letters = currentWord.answer.split("").map((char, index) => ({
        id: `${char}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        char
      }))
      
      // Shuffle letters
      const shuffled = [...letters].sort(() => Math.random() - 0.5)
      
      setJumbledLetters(shuffled)
      setPlacedLetters([])
      setStatus("jumbled")
    }
  }, [status, currentWord])

  const addPlacedLetter = useCallback((letter: JumbledLetter, index?: number) => {
    if (status !== "jumbled" && status !== "jumbled_incorrect") return
    
    const update = () => {
      setPlacedLetters(prev => {
        if (prev.some(pl => pl.id === letter.id)) return prev
        const result = [...prev]
        if (typeof index === "number") {
          result.splice(index, 0, letter)
        } else {
          result.push(letter)
        }
        return result
      })
      if (status === "jumbled_incorrect") setStatus("jumbled")
    }

    if (typeof document !== "undefined" && "startViewTransition" in document) {
      document.documentElement.classList.add("jumbled-transition")
      const transition = (document as any).startViewTransition(update)
      transition.finished.finally(() => {
        document.documentElement.classList.remove("jumbled-transition")
      })
    } else {
      update()
    }
  }, [status])

  const removePlacedLetter = useCallback((letter: JumbledLetter) => {
    if (status !== "jumbled" && status !== "jumbled_incorrect") return

    const update = () => {
      setPlacedLetters(prev => prev.filter(l => l.id !== letter.id))
      if (status === "jumbled_incorrect") setStatus("jumbled")
    }

    if (typeof document !== "undefined" && "startViewTransition" in document) {
      document.documentElement.classList.add("jumbled-transition")
      const transition = (document as any).startViewTransition(update)
      transition.finished.finally(() => {
        document.documentElement.classList.remove("jumbled-transition")
      })
    } else {
      update()
    }
  }, [status])

  const reorderPlacedLetter = useCallback((fromIndex: number, toIndex: number) => {
    if (status !== "jumbled" && status !== "jumbled_incorrect") return

    setPlacedLetters(prev => {
      const result = [...prev]
      const [removed] = result.splice(fromIndex, 1)
      result.splice(toIndex, 0, removed)
      return result
    })
    if (status === "jumbled_incorrect") setStatus("jumbled")
  }, [status])

  const submitJumbledAnswer = useCallback(() => {
    if ((status !== "jumbled" && status !== "jumbled_incorrect") || !currentWord) return
    
    const submittedAnswer = placedLetters.map(l => l.char).join("")
    if (submittedAnswer === currentWord.answer) {
      if (typeof document !== "undefined") {
        const inputEl = document.querySelector('input')
        if (inputEl) {
          inputEl.focus()
        }
      }
      setStatus("correct")
      playSpeechAndMoveToNext(currentWord.answer)
    } else {
      setStatus("jumbled_incorrect")
    }
  }, [status, currentWord, placedLetters, playSpeechAndMoveToNext])

  const showFinalAnswer = useCallback(() => {
    if (status === "jumbled_incorrect" && currentWord) {
      setStatus("show_answer")
      playSpeechAndMoveToNext(currentWord.answer)
    }
  }, [status, currentWord, playSpeechAndMoveToNext])

  const resetSession = useCallback(async () => {
    const nextGoal = Math.max(completedCount, totalQuestions) + 10
    
    // Update local state and localStorage synchronously for instant UI feedback
    setTotalQuestions(nextGoal)
    if (typeof window !== "undefined") {
      localStorage.setItem("wordflow-daily-goal", nextGoal.toString())
    }

    setCurrentIndex(0)
    setStatus("idle")
    setCurrentWord(null)
    setJumbledLetters([])
    setPlacedLetters([])
    
    try {
      await startSession(deckId, nextGoal)
      
      const [word, progress] = await Promise.all([fetchNextWord(), getUserProgress()])
      
      if (word) {
        setCurrentWord(word)
      } else {
        setStatus("complete")
      }
      
      if (progress) {
        setCompletedCount(progress.dailyCompleted)
        setTotalQuestions(progress.dailyGoal)
      }
    } catch (error) {
      console.error("Failed to reset session with 10 more questions:", error)
      setStatus("complete")
    }
  }, [deckId, completedCount, totalQuestions])

  return {
    currentIndex,
    currentWord,
    status,
    completedCount,
    totalQuestions,
    progressPercentage,
    lastUserInput,
    resultCorrectAnswer,
    jumbledLetters,
    placedLetters,
    handleInputStart,
    submitAnswer,
    showHint,
    addPlacedLetter,
    removePlacedLetter,
    reorderPlacedLetter,
    submitJumbledAnswer,
    showFinalAnswer,
    moveToNext,
    resetSession,
  }
}
