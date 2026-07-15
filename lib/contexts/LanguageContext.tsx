"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { en } from "@/lib/translations/en"
import { ko } from "@/lib/translations/ko"

export type Language = "en" | "ko"

export type Translations = typeof en

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: keyof Translations) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations: Record<Language, Translations> = {
  en,
  ko,
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedLang = localStorage.getItem("wordflow-language") as Language
    if (savedLang === "en" || savedLang === "ko") {
      setLanguageState(savedLang)
    }
    setMounted(true)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("wordflow-language", lang)
  }

  const t = (key: keyof Translations): string => {
    if (!mounted) {
      return en[key] || String(key)
    }
    return translations[language][key] || en[key] || String(key)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider")
  }
  return context
}
export type TranslationKeys = keyof Translations
