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
  maxStreak: number
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
  refreshToken?: string;
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

export function setRefreshToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("flow_refresh_token", token);
  }
}

export function getRefreshToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("flow_refresh_token");
  }
  return null;
}

export function removeAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("flow_token");
    localStorage.removeItem("flow_refresh_token");
  }
}

// Token refresh state
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onTokenRefreshed(token: string) {
  refreshSubscribers.map((callback) => callback(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

/**
 * Enhanced fetch wrapper that automatically handles Bearer token injection
 * and token refresh logic on 401 Unauthorized errors.
 */
async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers = {
    ...options.headers,
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  } as Record<string, string>;

  const res = await fetch(url, { ...options, headers });

  // If unauthorized, try to refresh the token
  if (res.status === 401) {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      removeAuthToken();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/signup")) {
        window.location.href = "/login";
      }
      return res;
    }

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/token`, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: refreshToken
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setAuthToken(data.accessToken);
          setRefreshToken(data.refreshToken);
          isRefreshing = false;
          onTokenRefreshed(data.accessToken);
        } else {
          isRefreshing = false;
          removeAuthToken();
          if (typeof window !== "undefined") window.location.href = "/login";
          return res;
        }
      } catch (error) {
        console.error("Token refresh failed:", error);
        isRefreshing = false;
        removeAuthToken();
        if (typeof window !== "undefined") window.location.href = "/login";
        return res;
      }
    }

    // If already refreshing, queue this request
    return new Promise((resolve) => {
      addRefreshSubscriber((newToken) => {
        resolve(fetch(url, {
          ...options,
          headers: {
            ...headers,
            "Authorization": `Bearer ${newToken}`
          }
        }));
      });
    });
  }

  return res;
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
  
  // Store both tokens
  if (data.accessToken) setAuthToken(data.accessToken);
  if (data.refreshToken) setRefreshToken(data.refreshToken);

  return {
    success: true,
    user: { email: credentials.email },
    token: data.accessToken,
    refreshToken: data.refreshToken
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
    return { dailyGoal: DEFAULT_GOAL, dailyCompleted: 0, streak: 0, maxStreak: 0, totalWordsLearned: 0, totalWords: 0 };
  }

  try {
    const [studyCountRes, streakRes] = await Promise.all([
      apiFetch(`${API_BASE_URL}/lesson/studyCount`),
      apiFetch(`${API_BASE_URL}/lesson/streak`)
    ]);

    const dailyCompleted = studyCountRes.ok ? await studyCountRes.json() : 0;
    const streakData = streakRes.ok ? await streakRes.json() : { streak: 0 };

    let dailyGoal = DEFAULT_GOAL;
    if (typeof window !== "undefined") {
      const savedGoal = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedGoal) dailyGoal = parseInt(savedGoal, 10);
    }

    return {
      dailyGoal,
      dailyCompleted: typeof dailyCompleted === "number" ? dailyCompleted : 0,
      streak: streakData.streak || 0,
      maxStreak: streakData.maxStreak || 0,
      totalWordsLearned: 0,
      totalWords: 0
    };
  } catch (error) {
    console.error("Failed to fetch user progress:", error);
    return { dailyGoal: DEFAULT_GOAL, dailyCompleted: 0, streak: 0, maxStreak: 0, totalWordsLearned: 0, totalWords: 0 };
  }
}

export async function getMonthlyStreak(year: number, month: number): Promise<string[]> {
  const res = await apiFetch(`${API_BASE_URL}/lesson/monthly-streak?year=${year}&month=${month}`);
  if (!res.ok) return [];
  return await res.json();
}

export async function startSession(deckId: string, count: number): Promise<void> {
  const res = await apiFetch(`${API_BASE_URL}/lesson/testCount?testCount=${count}`, {
    method: "POST"
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Failed to start session");
  }
}

export async function fetchNextWord(): Promise<WordItem | null> {
  const res = await apiFetch(`${API_BASE_URL}/lesson/test`, { 
    cache: 'no-store'
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
  return {
    deckId: "1",
    deckTitle: "Daily Lesson",
    totalQuestions: count || 10,
    words: [] 
  };
}

export async function verifyAnswer(wordId: string, userInput: string): Promise<VerifyResponse> {
  const res = await apiFetch(`${API_BASE_URL}/lesson/test`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json"
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
