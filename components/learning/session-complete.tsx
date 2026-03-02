// components/learning/session-complete.tsx
"use client"

import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SessionCompleteProps {
  completedCount: number
  totalWords: number
  onDashboard: () => void
  onRetry: () => void
}

export function SessionComplete({ completedCount, totalWords, onDashboard, onRetry }: SessionCompleteProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 animate-in fade-in duration-700">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-success/10">
          <Check className="size-10 text-success" />
        </div>
        <div>
          <h2 className="text-4xl font-semibold tracking-tight text-foreground font-[family-name:var(--font-heading)]">
            Session Complete
          </h2>
          <p className="mt-2 text-lg text-muted-foreground">
            You mastered {completedCount} out of {totalWords} words!
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onDashboard}>Dashboard</Button>
          <Button onClick={onRetry}>Practice Again</Button>
        </div>
        <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground/60">
          <p>Press <kbd className="font-mono bg-muted border border-muted-foreground/20 px-1.5 py-0.5 rounded text-foreground">Enter</kbd> to practice again</p>
          <p>Press <kbd className="font-mono bg-muted border border-muted-foreground/20 px-1.5 py-0.5 rounded text-foreground">ESC</kbd> to return to dashboard</p>
        </div>
      </div>
    </div>
  )
}