"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CircularProgress } from "@/components/circular-progress"
import { DailyGoalSetter } from "./daily-goal-setter"

interface AchievementCardProps {
  dailyCompleted: number
  dailyGoal: number
  onGoalChange: (newGoal: number) => void
  firstDeckId?: string
}

export function AchievementCard({
  dailyCompleted,
  dailyGoal,
  onGoalChange,
  firstDeckId,
}: AchievementCardProps) {
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
                Daily Progress
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                {dailyCompleted >= dailyGoal
                  ? "Incredible! You've reached your daily target. Feel free to set a higher goal or keep practicing."
                  : "You're doing great! Keep the momentum going to maintain your streak and master new vocabulary."}
              </p>
            </div>

            {/* Integrated Goal Setter */}
            <div className="bg-muted/40 p-5 rounded-2xl border border-border/50">
              <DailyGoalSetter goal={dailyGoal} onGoalChange={onGoalChange} />
            </div>

            {/* Call to Action */}
            {firstDeckId && (
              <Link href={`/learn/${firstDeckId}`} className="w-full">
                <Button size="lg" className="w-full h-12 text-base font-semibold gap-2 rounded-xl transition-all hover:gap-3">
                  Start Learning Now
                  <ArrowRight className="size-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}