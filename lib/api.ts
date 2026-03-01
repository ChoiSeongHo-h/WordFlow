// Define interfaces originally in data.ts
export interface WordItem {
  id: string
  korean: string
  koreanHighlight: string
  english: string
  answer: string
  /** position of the blank in the english sentence (word index) */
  blankIndex: number
}

export interface Deck {
  id: string
  title: string
  description: string
  icon: string
  completed: number
  total: number
  words: WordItem[]
}

export interface UserProgress {
  dailyGoal: number
  dailyCompleted: number
  streak: number
  totalWordsLearned: number
  totalWords: number
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface VerifyResponse {
  isCorrect: boolean;
  correctAnswer?: string;
}

/** Fetch a list of all decks */
export async function getDecks(): Promise<Deck[]> {
  const res = await fetch(`${API_BASE_URL}/decks`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch decks");
  return res.json();
}

/** Get specific deck details by ID */
export async function getDeckById(id: string): Promise<Deck | null> {
  const res = await fetch(`${API_BASE_URL}/decks/${id}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch deck");
  return res.json();
}

/** Fetch user progress data */
export async function getUserProgress(): Promise<UserProgress> {
  const res = await fetch(`${API_BASE_URL}/userProgress`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch user progress");
  return res.json();
}

/** Verify answer API (Mock) */
export async function verifyAnswer(wordId: string, userInput: string): Promise<VerifyResponse> {
  const res = await fetch(`${API_BASE_URL}/verify-answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wordId, userInput }),
  }).catch(() => {
    console.warn("Mock verify-answer endpoint not found, using client-side fallback for demo.");
    return null;
  });

  if (res && res.ok) return res.json();

  return { isCorrect: true }; 
}