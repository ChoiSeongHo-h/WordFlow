import { getSessionQuestions } from "@/lib/api"
import { LearningSession } from "@/components/learning-session"

/**
 * LearnPage handles the layout for a learning session.
 * It fetches the pre-initialized session data from the backend.
 */
export default async function LearnPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  // Fetch session data initialized via the dashboard
  const [sessionData, resolvedSearchParams] = await Promise.all([
    getSessionQuestions(),
    searchParams
  ])

  // Get total questions from query param 'q' or fallback to default
  const qParam = resolvedSearchParams.q
  const totalQuestions = typeof qParam === 'string' ? parseInt(qParam, 10) : sessionData.totalQuestions

  return (
    <LearningSession
      deckId={sessionData.deckId}
      deckTitle={sessionData.deckTitle}
      totalQuestions={totalQuestions}
    />
  )
}
