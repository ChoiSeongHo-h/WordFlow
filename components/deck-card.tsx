"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Briefcase, GraduationCap, MessageCircle, BookOpen } from "lucide-react"
import type { Deck } from "@/lib/data"

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
  const percentage = Math.round((deck.completed / deck.total) * 100)

  return (
    <Link href={`/learn/${deck.id}`}>
      <Card className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30 py-5">
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
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {deck.completed} / {deck.total} words
              </span>
              <span className="font-medium text-foreground">{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-1.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
