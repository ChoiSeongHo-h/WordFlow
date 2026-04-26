// lib/api.ts

export interface WordItem {
  id: string
  korean: string
  koreanHighlight: string
  english: string
  answer: string
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface VerifyResponse {
  isCorrect: boolean;
  isTypo?: boolean;
  correctAnswer?: string;
  solvedCount?: number;
  targetCount?: number;
}

export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("flow_token", token);
  }
}

export function getAuthToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("flow_token");
  }
  return null;
}

export function removeAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("flow_token");
  }
}

export function saveProgressLocally(deckId: string, currentIndex: number, completedCount: number) {}
export function loadLocalProgress(deckId: string) { return null; }

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Login failed");
  }
  const data = await res.json();
  return {
    success: true,
    user: { email: credentials.email },
    token: data.accessToken
  };
}

export async function signup(userData: SignupData): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: userData.email, password: userData.password, nickname: "User" }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Signup failed");
  }
  return {
    success: true,
    user: { email: userData.email },
    token: ""
  };
}

export async function getDecks(): Promise<Deck[]> {
  // Mock data for decks as backend doesn't have it yet
  return [
    { id: "1", title: "Daily Review", description: "Review your words", icon: "book", completed: 0, total: 10, words: [] }
  ];
}

export async function getDeckById(id: string): Promise<Deck | null> {
  return { id, title: "Daily Review", description: "Review your words", icon: "book", completed: 0, total: 10, words: [] };
}

export async function getUserProgress(): Promise<UserProgress> {
  const token = getAuthToken();
  const DEFAULT_GOAL = 10;
  const LOCAL_STORAGE_KEY = "wordflow-daily-goal";

  if (!token) {
    return { dailyGoal: DEFAULT_GOAL, dailyCompleted: 0, streak: 0, totalWordsLearned: 0, totalWords: 0 };
  }

  try {
    const [studyCountRes, streakRes] = await Promise.all([
      fetch(`${API_BASE_URL}/lesson/studyCount`, {
        headers: { "Authorization": `Bearer ${token}` }
      }),
      fetch(`${API_BASE_URL}/lesson/streak`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
    ]);

    const dailyCompleted = studyCountRes.ok ? await studyCountRes.json() : 0;
    const streakData = streakRes.ok ? await streakRes.json() : { streak: 0 };

    // Get goal from localStorage (matching dashboard logic)
    let dailyGoal = DEFAULT_GOAL;
    if (typeof window !== "undefined") {
      const savedGoal = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedGoal) dailyGoal = parseInt(savedGoal, 10);
    }

    return {
      dailyGoal,
      dailyCompleted: typeof dailyCompleted === "number" ? dailyCompleted : 0,
      streak: streakData.streak || 0,
      totalWordsLearned: 0,
      totalWords: 0
    };
  } catch (error) {
    console.error("Failed to fetch user progress:", error);
    return { dailyGoal: DEFAULT_GOAL, dailyCompleted: 0, streak: 0, totalWordsLearned: 0, totalWords: 0 };
  }
}

export async function startSession(deckId: string, count: number): Promise<void> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("User is not authenticated. Please log in.");
  }

  const res = await fetch(`${API_BASE_URL}/lesson/testCount?testCount=${count}`, {
    method: "POST",
    headers: { 
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      removeAuthToken();
      throw new Error("Your session has expired or you are not authorized. Please log in again.");
    }
    const errorText = await res.text();
    throw new Error(errorText || "Failed to start session");
  }
}

export async function fetchNextWord(): Promise<WordItem | null> {
  const res = await fetch(`${API_BASE_URL}/lesson/test`, { 
    cache: 'no-store',
    headers: { "Authorization": `Bearer ${getAuthToken()}` }
  });
  if (!res.ok) return null;
  const data = await res.json();
  
  const sentenceStr = data.sentence || "";
  const engMatch = sentenceStr.match(/\[(.*?)\]|\{(.*?)\}/);
  const answer = engMatch ? engMatch[1] || engMatch[2] : "";
  const english = sentenceStr.replace(/\[.*?\]|\{.*?\}/, "___");

  const meaningStr = (data.meaning || "").replace(/\r/g, "").trim();
  const korMatch = meaningStr.match(/\[(.*?)\]|\{(.*?)\}/);
  const koreanHighlight = korMatch ? korMatch[1] || korMatch[2] : "";
  const korean = meaningStr.replace(/[\[\]{}]/g, "");

  return {
    id: String(data.sentenceId),
    korean,
    koreanHighlight,
    english,
    answer,
    blankIndex: 0
  };
}

export async function getSessionQuestions(count?: number): Promise<SessionData> {
  // Return shell SessionData.
  return {
    deckId: "1",
    deckTitle: "Daily Lesson",
    totalQuestions: count || 10,
    words: [] 
  };
}

export async function verifyAnswer(wordId: string, userInput: string): Promise<VerifyResponse> {
  const res = await fetch(`${API_BASE_URL}/lesson/test`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({ sentenceId: Number(wordId), answer: userInput }),
  }).catch(() => null);

  if (res && res.ok) {
    const data = await res.json();
    return { 
      isCorrect: data.isCorrect,
      isTypo: data.isTypo,
      correctAnswer: data.correctAnswer,
      solvedCount: data.solvedCount || data.finishCount,
      targetCount: data.targetCount || data.goalCount
    };
  }
  return { isCorrect: false }; 
}
