"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Briefcase, GraduationCap, MessageCircle, BookOpen, Play, Loader2 } from "lucide-react"
import { startSession, type Deck } from "@/lib/api"

const iconMap: Record<string, React.ReactNode> = {
  briefcase: <Briefcase className="size-5" />,
  "graduation-cap": <GraduationCap className="size-5" />,
  "message-circle": <MessageCircle className="size-5" />,
  "book-open": <BookOpen className="size-5" />,
}

interface DeckCardProps {
  deck: Deck
}

export function DeckCard({ deck }: DeckCardProps) {
  const router = useRouter()
  const [questionCount, setQuestionCount] = React.useState("10")
  const [isStarting, setIsStarting] = React.useState(false)
  const percentage = Math.round((deck.completed / deck.total) * 100)

  const handleStart = async (e: React.MouseEvent) => {
    e.preventDefault()
    setIsStarting(true)
    try {
      await startSession(deck.id, parseInt(questionCount, 10))
      router.push(`/learn/${deck.id}`)
    } catch (error) {
      console.error("Failed to start session:", error)
      setIsStarting(false)
    }
  }

  return (
    <Card className="group transition-all duration-200 hover:shadow-md hover:border-primary/30 py-5">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {iconMap[deck.icon] || <BookOpen className="size-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground text-sm font-[family-name:var(--font-heading)]">
                {deck.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">{deck.description}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Overall Progress: {deck.completed} / {deck.total} words
            </span>
            <span className="font-medium text-foreground">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-1.5" />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1">
            <Select 
              value={questionCount} 
              onValueChange={setQuestionCount}
              disabled={isStarting}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Questions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 Questions</SelectItem>
                <SelectItem value="20">20 Questions</SelectItem>
                <SelectItem value="30">30 Questions</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            size="sm" 
            className="gap-2 h-9 px-4" 
            onClick={handleStart}
            disabled={isStarting}
          >
            {isStarting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Play className="size-3.5 fill-current" />
            )}
            Start Learning
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}