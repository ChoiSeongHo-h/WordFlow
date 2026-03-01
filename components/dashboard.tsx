"use client"

import { useState, useEffect } from "react"
import { Flame, Zap, TrendingUp, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CircularProgress } from "@/components/circular-progress"
import { DeckCard } from "@/components/deck-card"
import { getDecks, getUserProgress, type Deck, type UserProgress } from "@/lib/api"

export function Dashboard() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [decksData, progressData] = await Promise.all([
          getDecks(),
          getUserProgress()
        ])
        setDecks(decksData)
        setUserProgress(progressData)
      } catch (error) {
        console.error("Failed to load dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  if (isLoading || !userProgress) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="size-4" />
            </div>
            <h1 className="text-lg font-bold text-foreground font-[family-name:var(--font-heading)]">
              WordFlow
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5">
              <Flame className="size-4 text-chart-5" />
              <span className="text-sm font-semibold text-foreground">
                {userProgress.streak} days
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Bento Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Hero: Daily Goal - spans 2 cols */}
          <Card className="md:col-span-2 py-6">
            <CardContent className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
              <CircularProgress
                value={userProgress.dailyCompleted}
                max={userProgress.dailyGoal}
                size={150}
                strokeWidth={10}
              />
              <div className="flex flex-col gap-3 text-center sm:text-left">
                <div>
                  <p className="text-sm text-muted-foreground">Daily Goal</p>
                  <h2 className="text-2xl font-bold text-card-foreground font-[family-name:var(--font-heading)]">
                    {userProgress.dailyCompleted} of {userProgress.dailyGoal} words
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {"You're doing great! Keep going to reach today's goal and maintain your streak."}
                </p>
                {decks.length > 0 && (
                  <Link href={`/learn/${decks[0].id}`}>
                    <Button size="lg" className="mt-1 gap-2">
                      Start Learning Now
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Streak Card */}
          <Card className="py-6">
            <CardContent className="flex h-full flex-col justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <div className="mt-3 flex items-baseline gap-2">
                  <Flame className="size-8 text-chart-5" />
                  <span className="text-4xl font-bold text-card-foreground font-[family-name:var(--font-heading)]">
                    {userProgress.streak}
                  </span>
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-full ${
                      i < (userProgress?.streak || 0)
                        ? "bg-primary"
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="size-3.5" />
                <span>Best streak: 14 days</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Stats - small cards */}
          <Card className="py-5">
            <CardContent>
              <p className="text-sm text-muted-foreground">Words Learned</p>
              <p className="mt-1 text-3xl font-bold text-card-foreground font-[family-name:var(--font-heading)]">
                {userProgress.totalWordsLearned}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                out of {userProgress.totalWords} total
              </p>
            </CardContent>
          </Card>

          <Card className="py-5">
            <CardContent>
              <p className="text-sm text-muted-foreground">Decks Active</p>
              <p className="mt-1 text-3xl font-bold text-card-foreground font-[family-name:var(--font-heading)]">
                {decks.filter((d) => d.completed > 0).length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                of {decks.length} available
              </p>
            </CardContent>
          </Card>

          <Card className="py-5">
            <CardContent>
              <p className="text-sm text-muted-foreground">Accuracy</p>
              <p className="mt-1 text-3xl font-bold text-card-foreground font-[family-name:var(--font-heading)]">
                87%
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                last 7 days average
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Deck Library */}
        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground font-[family-name:var(--font-heading)]">
              Word Decks
            </h2>
            <span className="text-sm text-muted-foreground">
              {decks.length} decks
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {decks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}