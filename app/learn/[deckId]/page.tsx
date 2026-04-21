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
  // Fetch search params first to pass to getSessionQuestions
  const resolvedSearchParams = await searchParams
  const qParam = resolvedSearchParams.q
  const count = typeof qParam === 'string' ? parseInt(qParam, 10) : undefined

  // Fetch session data initialized via the dashboard
  const sessionData = await getSessionQuestions(count)

  const totalQuestions = count || sessionData.totalQuestions

  return (
    <LearningSession
      deckId={sessionData.deckId}
      deckTitle={sessionData.deckTitle}
      totalQuestions={totalQuestions}
    />
  )
}
