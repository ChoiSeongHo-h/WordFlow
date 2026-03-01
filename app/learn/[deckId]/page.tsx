import { notFound } from "next/navigation"
import { getDeckById } from "@/lib/api"
import { LearningSession } from "@/components/learning-session"

interface LearnPageProps {
  params: Promise<{ deckId: string }>
}

export default async function LearnPage({ params }: LearnPageProps) {
  const { deckId } = await params

  const deck = await getDeckById(deckId)

  if (!deck) {
    notFound()
  }

  return <LearningSession deckTitle={deck.title} words={deck.words} />
}