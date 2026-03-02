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

export interface SessionData {
  deckId: string;
  deckTitle: string;
  totalQuestions: number;
  words: WordItem[];
}

// Authentication Interfaces
export interface AuthResponse {
  success: boolean;
  user: { email: string };
  token: string;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface SignupData extends LoginCredentials {
  goals: string[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface VerifyResponse {
  isCorrect: boolean;
  correctAnswer?: string;
}

/** Helper to save token */
export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("flow_token", token);
  }
}

/** Helper to get token */
export function getAuthToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("flow_token");
  }
  return null;
}

/** Login API */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data;
}

/** Signup API */
export async function signup(userData: SignupData): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Signup failed");
  return data;
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

/** Initialize a learning session */
export async function startSession(deckId: string, count: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/sessions/start`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({ deckId, count }),
  });
  if (!res.ok) throw new Error("Failed to start session");
}

/** Fetch the questions for the current active session */
export async function getSessionQuestions(): Promise<SessionData> {
  const res = await fetch(`${API_BASE_URL}/api/sessions/questions`, { 
    cache: 'no-store',
    headers: { "Authorization": `Bearer ${getAuthToken()}` }
  });
  if (!res.ok) throw new Error("Failed to fetch session questions");
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