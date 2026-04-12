import { getSessionQuestions } from "@/lib/api"
import { LearningSession } from "@/components/learning-session"

/**
 * LearnPage handles the layout for a learning session.
 * It fetches the pre-initialized session data from the backend.
 */
export default async function LearnPage() {
  // Fetch session data initialized via the dashboard
  const sessionData = await getSessionQuestions()

  return (
    <LearningSession
      deckId={sessionData.deckId}
      deckTitle={sessionData.deckTitle}
      totalQuestions={sessionData.totalQuestions}
    />
  )
}
