// hooks/use-learning-session.ts
import { useState, useCallback, useEffect, useRef } from "react"
import { verifyAnswer, fetchNextWord, getUserProgress, startSession, type WordItem, SessionConflictError } from "@/lib/api"

export type SessionStatus = "idle" | "validating" | "correct" | "incorrect" | "typo" | "jumbled" | "jumbled_incorrect" | "show_answer" | "complete"

export interface JumbledLetter {
  id: string
  char: string
}

export interface HistoryItem {
  word: WordItem
  status: SessionStatus
  lastUserInput: string
  resultCorrectAnswer: string
  jumbledLetters: JumbledLetter[]
  placedLetters: JumbledLetter[]
  isClose: boolean
  diffCount: number
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
  isClose: boolean
  diffCount: number
  isConflict: boolean
  hasPrev: boolean
  handleInputStart: () => void
  submitAnswer: (answer: string) => Promise<void>
  showHint: () => void
  addPlacedLetter: (letter: JumbledLetter, index?: number) => void
  removePlacedLetter: (letter: JumbledLetter) => void
  reorderPlacedLetter: (fromIndex: number, toIndex: number) => void
  submitJumbledAnswer: () => void
  showFinalAnswer: () => void
  moveToNext: () => void
  moveToPrev: () => void
  resetSession: () => void
  replaySpeech: () => void
}

export function useLearningSession(deckId: string, initialTotalQuestions: number): UseLearningSessionReturn {
  const [wordsHistory, setWordsHistory] = useState<HistoryItem[]>([])
  const [historyIndex, setHistoryIndex] = useState<number>(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(initialTotalQuestions)
  const [isConflict, setIsConflict] = useState(false)
  const [globalStatus, setGlobalStatus] = useState<SessionStatus | null>(null)
  
  const isMovingRef = useRef(false)

  const progressPercentage = Math.round((completedCount / totalQuestions) * 100)

  const currentItem = wordsHistory[historyIndex] || null
  const currentWord = currentItem ? currentItem.word : null
  const status = globalStatus || (currentItem ? currentItem.status : "idle")
  const lastUserInput = currentItem ? currentItem.lastUserInput : ""
  const resultCorrectAnswer = currentItem ? currentItem.resultCorrectAnswer : ""
  const jumbledLetters = currentItem ? currentItem.jumbledLetters : []
  const placedLetters = currentItem ? currentItem.placedLetters : []
  const isClose = currentItem ? currentItem.isClose : false
  const diffCount = currentItem ? currentItem.diffCount : 0

  const hasPrev = historyIndex > 0 && (
    historyIndex < wordsHistory.length - 1 ||
    status === "correct" ||
    status === "typo" ||
    status === "show_answer"
  )

  const handleError = useCallback((error: any) => {
    if (error instanceof SessionConflictError) {
      setIsConflict(true)
    } else {
      setGlobalStatus(null)
      console.error("Session error occurred:", error);
    }
  }, [])

  // Fetch initial word and progress on mount
  useEffect(() => {
    setGlobalStatus("validating")
    Promise.all([fetchNextWord(), getUserProgress()])
      .then(([word, progress]) => {
        if (word) {
          setWordsHistory([{
            word,
            status: "idle",
            lastUserInput: "",
            resultCorrectAnswer: "",
            jumbledLetters: [],
            placedLetters: [],
            isClose: false,
            diffCount: 0
          }])
          setHistoryIndex(0)
          setGlobalStatus(null)
        } else {
          setGlobalStatus("complete")
        }
        
        if (progress) {
          setCompletedCount(progress.dailyCompleted)
          setTotalQuestions(progress.dailyGoal)
        }
      })
      .catch((err) => {
        if (err instanceof SessionConflictError) {
          setIsConflict(true)
        } else {
          setGlobalStatus("complete")
        }
      });
  }, [deckId])

  const handleInputStart = useCallback(() => {
    if (currentItem && currentItem.status === "incorrect") {
      setWordsHistory(prev => {
        const next = [...prev]
        next[historyIndex] = {
          ...next[historyIndex],
          status: "idle",
          isClose: false,
          diffCount: 0
        }
        return next
      })
    }
  }, [currentItem, historyIndex])

  const moveToNext = useCallback(async () => {
    if (isMovingRef.current) return

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }

    if (typeof document !== "undefined") {
      const inputEl = document.querySelector('input')
      if (inputEl) {
        const originalReadOnly = inputEl.readOnly
        inputEl.readOnly = false
        inputEl.focus({ preventScroll: true })
        inputEl.readOnly = originalReadOnly
      }
    }

    if (historyIndex < wordsHistory.length - 1) {
      setHistoryIndex(prev => prev + 1)
      return
    }

    if (completedCount < totalQuestions) {
      isMovingRef.current = true
      setGlobalStatus("validating")
      
      try {
        const nextWord = await fetchNextWord()
        if (nextWord) {
          setWordsHistory(prev => [
            ...prev,
            {
              word: nextWord,
              status: "idle",
              lastUserInput: "",
              resultCorrectAnswer: "",
              jumbledLetters: [],
              placedLetters: [],
              isClose: false,
              diffCount: 0
            }
          ])
          setHistoryIndex(prev => prev + 1)
          setGlobalStatus(null)
        } else {
          setGlobalStatus("complete")
        }
      } catch (err) {
        handleError(err)
      } finally {
        isMovingRef.current = false
      }
    } else {
      setGlobalStatus("complete")
    }
  }, [historyIndex, wordsHistory.length, completedCount, totalQuestions, handleError])

  const moveToPrev = useCallback(() => {
    if (historyIndex > 0) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
      setHistoryIndex(prev => prev - 1)
      setGlobalStatus(null)
    }
  }, [historyIndex])

  const playSpeech = useCallback((answerText: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()

      if (!currentWord) return

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

      window.speechSynthesis.speak(utterance)
    }
  }, [currentWord])

  const replaySpeech = useCallback(() => {
    if (!currentWord) return
    const finalAnswer = resultCorrectAnswer || currentWord.answer
    playSpeech(finalAnswer)
  }, [currentWord, resultCorrectAnswer, playSpeech])

  const submitAnswer = useCallback(async (answer: string) => {
    if (!answer || globalStatus === "validating" || (currentItem && (currentItem.status === "correct" || currentItem.status === "typo")) || !currentWord) return

    setGlobalStatus("validating")
    
    try {
      const result = await verifyAnswer(currentWord.id, answer)
      
      if (result.solvedCount !== undefined) setCompletedCount(result.solvedCount)
      if (result.targetCount !== undefined) setTotalQuestions(result.targetCount)

      setWordsHistory(prev => {
        const next = [...prev]
        let newStatus: SessionStatus = "incorrect"
        let corrAnswer = result.correctAnswer || currentWord.answer
        
        if (result.isCorrect) {
          newStatus = result.isTypo ? "typo" : "correct"
        }

        next[historyIndex] = {
          ...next[historyIndex],
          status: newStatus,
          lastUserInput: answer,
          resultCorrectAnswer: corrAnswer,
          isClose: !result.isCorrect && !!result.isClose,
          diffCount: !result.isCorrect ? (result.diffCount || 0) : 0
        }
        return next
      })
      
      setGlobalStatus(null)

      if (result.isCorrect) {
        const finalAnswer = result.correctAnswer || currentWord.answer
        playSpeech(finalAnswer)
      }
    } catch (error) {
      handleError(error)
    }
  }, [currentWord, globalStatus, currentItem, historyIndex, playSpeech, handleError])

  const showHint = useCallback(() => {
    if (currentItem && currentItem.status === "incorrect" && currentWord) {
      const letters = currentWord.answer.split("").map((char, index) => ({
        id: `${char}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        char
      }))
      const shuffled = [...letters].sort(() => Math.random() - 0.5)
      
      setWordsHistory(prev => {
        const next = [...prev]
        next[historyIndex] = {
          ...next[historyIndex],
          status: "jumbled",
          jumbledLetters: shuffled,
          placedLetters: []
        }
        return next
      })
    }
  }, [currentItem, currentWord, historyIndex])

  const addPlacedLetter = useCallback((letter: JumbledLetter, index?: number) => {
    if (!currentItem || (currentItem.status !== "jumbled" && currentItem.status !== "jumbled_incorrect")) return
    
    const update = () => {
      setWordsHistory(prev => {
        const next = [...prev]
        const item = next[historyIndex]
        if (item.placedLetters.some(pl => pl.id === letter.id)) return prev
        const newPlaced = [...item.placedLetters]
        if (typeof index === "number") {
          newPlaced.splice(index, 0, letter)
        } else {
          newPlaced.push(letter)
        }
        next[historyIndex] = {
          ...item,
          placedLetters: newPlaced,
          status: item.status === "jumbled_incorrect" ? "jumbled" : item.status
        }
        return next
      })
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
  }, [currentItem, historyIndex])

  const removePlacedLetter = useCallback((letter: JumbledLetter) => {
    if (!currentItem || (currentItem.status !== "jumbled" && currentItem.status !== "jumbled_incorrect")) return

    const update = () => {
      setWordsHistory(prev => {
        const next = [...prev]
        const item = next[historyIndex]
        next[historyIndex] = {
          ...item,
          placedLetters: item.placedLetters.filter(l => l.id !== letter.id),
          status: item.status === "jumbled_incorrect" ? "jumbled" : item.status
        }
        return next
      })
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
  }, [currentItem, historyIndex])

  const reorderPlacedLetter = useCallback((fromIndex: number, toIndex: number) => {
    if (!currentItem || (currentItem.status !== "jumbled" && currentItem.status !== "jumbled_incorrect")) return

    setWordsHistory(prev => {
      const next = [...prev]
      const item = next[historyIndex]
      const newPlaced = [...item.placedLetters]
      const [removed] = newPlaced.splice(fromIndex, 1)
      newPlaced.splice(toIndex, 0, removed)
      next[historyIndex] = {
        ...item,
        placedLetters: newPlaced,
        status: item.status === "jumbled_incorrect" ? "jumbled" : item.status
      }
      return next
    })
  }, [currentItem, historyIndex])

  const submitJumbledAnswer = useCallback(() => {
    if (!currentItem || (currentItem.status !== "jumbled" && currentItem.status !== "jumbled_incorrect") || !currentWord) return
    
    const submittedAnswer = placedLetters.map(l => l.char).join("")
    if (submittedAnswer === currentWord.answer) {
      if (typeof document !== "undefined") {
        const inputEl = document.querySelector('input')
        if (inputEl) {
          inputEl.focus({ preventScroll: true })
        }
      }
      setWordsHistory(prev => {
        const next = [...prev]
        next[historyIndex] = {
          ...next[historyIndex],
          status: "correct"
        }
        return next
      })
      playSpeech(currentWord.answer)
    } else {
      setWordsHistory(prev => {
        const next = [...prev]
        next[historyIndex] = {
          ...next[historyIndex],
          status: "jumbled_incorrect"
        }
        return next
      })
    }
  }, [currentItem, currentWord, placedLetters, historyIndex, playSpeech])

  const showFinalAnswer = useCallback(() => {
    if (currentItem && currentItem.status === "jumbled_incorrect" && currentWord) {
      setWordsHistory(prev => {
        const next = [...prev]
        next[historyIndex] = {
          ...next[historyIndex],
          status: "show_answer"
        }
        return next
      })
      playSpeech(currentWord.answer)
    }
  }, [currentItem, currentWord, historyIndex, playSpeech])

  const resetSession = useCallback(async () => {
    const nextGoal = Math.max(completedCount, totalQuestions) + 10
    
    setTotalQuestions(nextGoal)
    if (typeof window !== "undefined") {
      localStorage.setItem("wordflow-daily-goal", nextGoal.toString())
    }

    setWordsHistory([])
    setHistoryIndex(0)
    setGlobalStatus("validating")
    
    try {
      await startSession(deckId, nextGoal)
      
      const [word, progress] = await Promise.all([fetchNextWord(), getUserProgress()])
      
      if (word) {
        setWordsHistory([{
          word,
          status: "idle",
          lastUserInput: "",
          resultCorrectAnswer: "",
          jumbledLetters: [],
          placedLetters: [],
          isClose: false,
          diffCount: 0
        }])
        setHistoryIndex(0)
        setGlobalStatus(null)
      } else {
        setGlobalStatus("complete")
      }
      
      if (progress) {
        setCompletedCount(progress.dailyCompleted)
        setTotalQuestions(progress.dailyGoal)
      }
    } catch (error) {
      handleError(error)
    }
  }, [deckId, completedCount, totalQuestions, handleError])

  return {
    currentIndex: historyIndex,
    currentWord,
    status,
    completedCount,
    totalQuestions,
    progressPercentage,
    lastUserInput,
    resultCorrectAnswer,
    jumbledLetters,
    placedLetters,
    isClose,
    diffCount,
    isConflict,
    hasPrev,
    handleInputStart,
    submitAnswer,
    showHint,
    addPlacedLetter,
    removePlacedLetter,
    reorderPlacedLetter,
    submitJumbledAnswer,
    showFinalAnswer,
    moveToNext,
    moveToPrev,
    resetSession,
    replaySpeech,
  }
}
