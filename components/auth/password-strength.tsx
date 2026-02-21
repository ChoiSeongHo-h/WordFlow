"use client"

import { cn } from "@/lib/utils"

interface PasswordStrengthProps {
  password: string
}

function getStrength(password: string): { score: number; label: string } {
  if (!password) return { score: 0, label: "" }

  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 1) return { score: 1, label: "Weak" }
  if (score <= 2) return { score: 2, label: "Fair" }
  if (score <= 3) return { score: 3, label: "Good" }
  return { score: 4, label: "Strong" }
}

const strengthColors: Record<number, string> = {
  0: "bg-muted",
  1: "bg-destructive",
  2: "bg-chart-5",
  3: "bg-chart-4",
  4: "bg-success",
}

const strengthTextColors: Record<number, string> = {
  0: "text-muted-foreground",
  1: "text-destructive",
  2: "text-chart-5",
  3: "text-chart-4",
  4: "text-success",
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { score, label } = getStrength(password)

  if (!password) return null

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              level <= score ? strengthColors[score] : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className={cn("text-xs transition-colors", strengthTextColors[score])}>
        {label}
      </p>
    </div>
  )
}
