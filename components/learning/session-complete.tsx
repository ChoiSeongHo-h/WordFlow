// components/learning/session-complete.tsx
"use client"

import { useState, useEffect } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTranslation } from "@/lib/contexts/LanguageContext"

interface SessionCompleteProps {
  completedCount: number
  totalWords: number
  onDashboard: () => void
  onRetry: () => void
}

export function SessionComplete({ completedCount, totalWords, onDashboard, onRetry }: SessionCompleteProps) {
  const [mounted, setMounted] = useState(false)
  const isMobile = useIsMobile()
  const { t } = useTranslation()

  useEffect(() => {
    setMounted(true)
  }, [])

  const dashboardLabel = mounted && !isMobile ? t("dashboardLabelWithEsc") : t("dashboardLabel")
  const retryLabel = mounted && !isMobile ? t("practiceMoreWithEnter") : t("practiceMore")

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 animate-in fade-in duration-700">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-success/10">
          <Check className="size-10 text-success" />
        </div>
        <div>
          <h2 className="text-4xl font-semibold tracking-tight text-foreground font-[family-name:var(--font-heading)]">
            {t("sessionComplete")}
          </h2>
          <p className="mt-2 text-lg text-muted-foreground">
            {t("masteredWordsDesc").replace("{completed}", String(completedCount)).replace("{total}", String(totalWords))}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onDashboard}>
            {dashboardLabel}
          </Button>
          <Button onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}