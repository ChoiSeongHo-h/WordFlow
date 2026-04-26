"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Flame, Zap, TrendingUp, Loader2, BookOpen, Target, BarChart3, Settings } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AchievementCard } from "@/components/dashboard/achievement-card"
import { Calendar } from "@/components/ui/calendar"
import { getUserProgress, getMonthlyStreak, type UserProgress } from "@/lib/api"
import { cn } from "@/lib/utils"

const LOCAL_STORAGE_KEY = "wordflow-daily-goal"
const DEFAULT_GOAL = 20

export default function DashboardPage() {
  const router = useRouter()
  const [userProgress, setUserProgress] = React.useState<UserProgress | null>(null)
  const [activeDates, setActiveDates] = React.useState<Date[]>([])
  const [dailyGoal, setDailyGoal] = React.useState<number>(DEFAULT_GOAL)
  const [isLoading, setIsLoading] = React.useState(true)

  // Initialize data and local storage
  React.useEffect(() => {
    const token = localStorage.getItem("flow_token");
    if (!token) {
      router.push("/login");
      return;
    }

    async function loadData() {
      try {
        const now = new Date();
        const [progressData, streakDates] = await Promise.all([
          getUserProgress(),
          getMonthlyStreak(now.getFullYear(), now.getMonth() + 1)
        ])
        
        // Load goal from localStorage or API
        const savedGoal = localStorage.getItem(LOCAL_STORAGE_KEY)
        const initialGoal = savedGoal ? parseInt(savedGoal, 10) : (progressData?.dailyGoal || DEFAULT_GOAL)
        
        setUserProgress(progressData)
        setActiveDates(streakDates.map(d => new Date(d)))
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
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push("/settings")}
              className="rounded-full hover:bg-accent"
            >
              <Settings className="size-5 text-muted-foreground transition-colors group-hover:text-foreground" />
            </Button>
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
          />

          {/* Streak Status Card - Monthly Calendar View */}
          <Card className="border-border/30 shadow-sm bg-card/40 hover:bg-card/60 transition-colors backdrop-blur-sm">
            <CardContent className="flex h-full flex-col justify-between gap-4 p-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">Flow History</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <Flame className="size-8 text-orange-500 fill-orange-500 animate-pulse" style={{ animationDuration: '3s' }} />
                  <span className="text-5xl font-black text-foreground font-[family-name:var(--font-heading)] tracking-tighter">
                    {userProgress.streak}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">days</span>
                </div>
              </div>
              
              <div className="flex-1 flex items-center justify-center py-2">
                <Calendar
                  mode="multiple"
                  selected={activeDates}
                  className="p-0 border-none pointer-events-none scale-90 origin-center"
                  classNames={{
                    selected: "![&_button]:bg-orange-500 ![&_button]:text-white ![&_button]:opacity-100",
                    today: "bg-accent text-accent-foreground border border-orange-500/50 rounded-md",
                  }}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="size-3.5 text-orange-500" />
                    Personal Best: {userProgress.maxStreak}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Secondary Stats */}
          <Card className="md:col-span-2 border-none shadow-sm bg-card/50 hover:bg-card transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <BookOpen className="size-4" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Words Learned</p>
              </div>
              <p className="text-3xl font-bold text-foreground font-[family-name:var(--font-heading)]">
                {userProgress.totalWordsLearned.toLocaleString()}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${userProgress.totalWords > 0 ? (userProgress.uniqueWordsLearned / userProgress.totalWords) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {userProgress.totalWords > 0 ? Math.round((userProgress.uniqueWordsLearned / userProgress.totalWords) * 100) : 0}%
                </span>
              </div>
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
                {Math.round(userProgress.avgAccuracy)}%
              </p>
              <p className="mt-1 text-xs font-medium text-muted-foreground italic">
                {userProgress.avgAccuracy >= 90 ? "Excellent accuracy!" : 
                 userProgress.avgAccuracy >= 70 ? "Great job, keep it up!" :
                 userProgress.avgAccuracy > 0 ? "Keep practicing to improve!" : "Start your first lesson!"}
              </p>
              </CardContent>
              </Card>

        </div>
      </main>
    </div>
  )
}