"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CircularProgress } from "@/components/circular-progress"
import { DailyGoalSetter } from "./daily-goal-setter"
import { startSession } from "@/lib/api"
import { toast } from "sonner"
import { useTranslation } from "@/lib/contexts/LanguageContext"

interface AchievementCardProps {
  dailyCompleted: number
  dailyGoal: number
  onGoalChange: (newGoal: number) => void
}

export function AchievementCard({
  dailyCompleted,
  dailyGoal,
  onGoalChange,
}: AchievementCardProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const [isStarting, setIsStarting] = React.useState(false)

  const handleStartNow = async () => {
    const deckId = "1" // Default Daily Review deck ID
    
  setIsStarting(true)
    try {
      await startSession(deckId, dailyGoal) 
      router.push(`/learn/${deckId}?q=${dailyGoal}`)
    } catch (error: any) {
      console.error("Failed to start session:", error)
      toast.error(error.message || t("failedToStartSession"))
      setIsStarting(false)
    }
  }

  return (
    <Card className="md:col-span-2 overflow-hidden border-none shadow-md bg-card/50 backdrop-blur-sm">
      <CardContent className="p-8">
        <div className="flex flex-col lg:flex-row items-center gap-10">
          {/* Progress Visualization */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-primary/5 rounded-full blur-xl transition-all group-hover:bg-primary/10" />
            <CircularProgress
              value={dailyCompleted}
              max={dailyGoal}
              size={180}
              strokeWidth={12}
              className="relative z-10"
            />
          </div>

          {/* Controls and Info */}
          <div className="flex flex-1 flex-col gap-6 w-full">
            <div className="space-y-2 text-center lg:text-left">
              <h2 className="text-3xl font-bold tracking-tight text-foreground font-[family-name:var(--font-heading)]">
                {t("dailyProgress")}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                {dailyCompleted >= dailyGoal
                  ? t("dailyTargetReached")
                  : t("dailyTargetPending")}
              </p>
            </div>

            {/* Integrated Goal Setter */}
            <div className="bg-muted/40 p-5 rounded-2xl border border-border/50">
              <DailyGoalSetter 
                goal={dailyGoal} 
                onGoalChange={onGoalChange} 
                completedWords={dailyCompleted} 
              />
            </div>

            {/* Call to Action */}
            <Button 
              size="lg" 
              className="w-full h-12 text-base font-semibold gap-2 rounded-xl transition-all hover:gap-3"
              onClick={handleStartNow}
              disabled={isStarting || dailyGoal <= dailyCompleted}
            >
                {isStarting ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    {t("preparing")}
                  </>
                ) : (
                  <>
                    {t("startLearningNow")}
                    <ArrowRight className="size-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
      </CardContent>
    </Card>
  )
}