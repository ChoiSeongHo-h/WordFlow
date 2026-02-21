import { notFound } from "next/navigation"
import { decks } from "@/lib/data"
import { LearningSession } from "@/components/learning-session"

interface LearnPageProps {
  params: Promise<{ deckId: string }>
}

export default async function LearnPage({ params }: LearnPageProps) {
  const { deckId } = await params

  const deck = decks.find((d) => d.id === deckId)

  if (!deck) {
    notFound()
  }

  return <LearningSession deckTitle={deck.title} words={deck.words} />
}
