"use client"

import * as React from "react"
import { Flame, Zap, TrendingUp, Loader2, BookOpen, Target, BarChart3 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { DeckCard } from "@/components/deck-card"
import { AchievementCard } from "@/components/dashboard/achievement-card"
import { getDecks, getUserProgress, type Deck, type UserProgress } from "@/lib/api"
import { cn } from "@/lib/utils"

const LOCAL_STORAGE_KEY = "wordflow-daily-goal"
const DEFAULT_GOAL = 20

export default function DashboardPage() {
  const [decks, setDecks] = React.useState<Deck[]>([])
  const [userProgress, setUserProgress] = React.useState<UserProgress | null>(null)
  const [dailyGoal, setDailyGoal] = React.useState<number>(DEFAULT_GOAL)
  const [isLoading, setIsLoading] = React.useState(true)

  // Initialize data and local storage
  React.useEffect(() => {
    async function loadData() {
      try {
        const [decksData, progressData] = await Promise.all([
          getDecks(),
          getUserProgress()
        ])
        
        // Load goal from localStorage or API
        const savedGoal = localStorage.getItem(LOCAL_STORAGE_KEY)
        const initialGoal = savedGoal ? parseInt(savedGoal, 10) : (progressData?.dailyGoal || DEFAULT_GOAL)
        
        setDecks(decksData)
        setUserProgress(progressData)
        setDailyGoal(initialGoal)
      } catch (error) {
        console.error("Failed to load dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Persist goal changes
  const handleGoalChange = (newGoal: number) => {
    setDailyGoal(newGoal)
    localStorage.setItem(LOCAL_STORAGE_KEY, newGoal.toString())
  }

  if (isLoading || !userProgress) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-10 animate-spin text-primary/80" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading your flow...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/10">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 text-primary-foreground">
              <Zap className="size-5 fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground font-[family-name:var(--font-heading)]">
              WordFlow
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-accent/50 border border-border/50 px-4 py-1.5 transition-colors hover:bg-accent">
              <Flame className="size-4 text-orange-500 fill-orange-500" />
              <span className="text-sm font-bold text-foreground">
                {userProgress.streak} day streak
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          
          {/* Main Hero Achievement Card */}
          <AchievementCard 
            dailyCompleted={userProgress.dailyCompleted}
            dailyGoal={dailyGoal}
            onGoalChange={handleGoalChange}
            firstDeckId={decks.length > 0 ? decks[0].id : undefined}
          />

          {/* Streak Status Card - Redesigned for "Desire to Fill" */}
          <Card className="border-border/30 shadow-sm bg-card/40 hover:bg-card/60 transition-colors backdrop-blur-sm">
            <CardContent className="flex h-full flex-col justify-between gap-6 p-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">Current Flow</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <Flame className="size-8 text-orange-500 fill-orange-500 animate-pulse" style={{ animationDuration: '3s' }} />
                  <span className="text-5xl font-black text-foreground font-[family-name:var(--font-heading)] tracking-tighter">
                    {userProgress.streak}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">days</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {/* Continuous visual blocks representing a week to trigger completion desire */}
                <div className="flex gap-1.5 p-1.5 rounded-full bg-muted/50 border border-border/50">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const isCompleted = i < (userProgress?.streak || 0);
                    const isToday = i === (userProgress?.streak || 0) - 1;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "h-3 flex-1 rounded-full transition-all duration-700",
                          isCompleted ? "bg-orange-500" : "bg-muted-foreground/15",
                          isToday && "shadow-[0_0_12px_rgba(249,115,22,0.6)] scale-105" // Glow effect for current streak day
                        )}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="size-3.5 text-orange-500" />
                    Personal Best: 14
                  </span>
                  <span className="text-muted-foreground/50">Keep pushing</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Secondary Stats */}
          <Card className="border-none shadow-sm bg-card/50 hover:bg-card transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <BookOpen className="size-4" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Words Learned</p>
              </div>
              <p className="text-3xl font-bold text-foreground font-[family-name:var(--font-heading)]">
                {userProgress.totalWordsLearned}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${(userProgress.totalWordsLearned / userProgress.totalWords) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {Math.round((userProgress.totalWordsLearned / userProgress.totalWords) * 100)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 hover:bg-card transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                  <Target className="size-4" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Decks Active</p>
              </div>
              <p className="text-3xl font-bold text-foreground font-[family-name:var(--font-heading)]">
                {decks.filter((d) => d.completed > 0).length}
              </p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                Out of {decks.length} collections
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 hover:bg-card transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <BarChart3 className="size-4" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Accuracy</p>
              </div>
              <p className="text-3xl font-bold text-foreground font-[family-name:var(--font-heading)]">
                87%
              </p>
              <p className="mt-1 text-xs font-medium text-muted-foreground italic">
                Consistent performance
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Deck Library Section */}
        <section className="mt-16">
          <div className="mb-8 flex items-end justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-foreground font-[family-name:var(--font-heading)]">
                Your Word Decks
              </h2>
              <p className="text-sm text-muted-foreground">Select a deck to continue your flow.</p>
            </div>
            <div className="hidden sm:block px-3 py-1 rounded-md bg-muted text-[11px] font-bold uppercase tracking-tighter text-muted-foreground">
              {decks.length} Decks Available
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {decks.map((deck) => (
              <div key={deck.id} className="group transition-transform duration-300 hover:-translate-y-1">
                <DeckCard deck={deck} />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}