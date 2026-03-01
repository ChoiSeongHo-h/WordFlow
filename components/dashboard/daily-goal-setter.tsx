"use client"

import * as React from "react"
import { Settings2, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface DailyGoalSetterProps {
  goal: number
  onGoalChange: (newGoal: number) => void
  className?: string
}

export function DailyGoalSetter({ goal, onGoalChange, className }: DailyGoalSetterProps) {
  // Update goal using step buttons
  const adjustGoal = (amount: number) => {
    const newGoal = Math.max(5, Math.min(100, goal + amount))
    onGoalChange(newGoal)
  }

  return (
    <div className={cn("flex flex-col gap-4 w-full", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="size-4 text-muted-foreground" />
          <Label className="text-sm font-medium text-foreground">Set Daily Goal</Label>
        </div>
        <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
          {goal} words
        </span>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="size-8 rounded-full shrink-0"
          onClick={() => adjustGoal(-5)}
          disabled={goal <= 5}
        >
          <Minus className="size-3" />
        </Button>
        
        <Slider
          value={[goal]}
          min={5}
          max={100}
          step={5}
          onValueChange={(value) => onGoalChange(value[0])}
          className="flex-1"
        />

        <Button
          variant="outline"
          size="icon"
          className="size-8 rounded-full shrink-0"
          onClick={() => adjustGoal(5)}
          disabled={goal >= 100}
        >
          <Plus className="size-3" />
        </Button>
      </div>
      
      <p className="text-[11px] text-muted-foreground italic text-center">
        Adjusting your goal will update your progress circle in real-time.
      </p>
    </div>
  )
}   