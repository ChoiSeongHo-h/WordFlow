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

export const decks: Deck[] = [
  {
    id: "business-english",
    title: "Business English",
    description: "Essential vocabulary for the workplace",
    icon: "briefcase",
    completed: 12,
    total: 30,
    words: [
      {
        id: "be-1",
        korean: '우리는 분기별 보고서를 "제출해야" 합니다.',
        koreanHighlight: "제출해야",
        english: "We need to ___ the quarterly report.",
        answer: "submit",
        blankIndex: 4,
      },
      {
        id: "be-2",
        korean: '그녀는 회의를 다음 주로 "연기했다."',
        koreanHighlight: "연기했다",
        english: "She ___ the meeting to next week.",
        answer: "postponed",
        blankIndex: 1,
      },
      {
        id: "be-3",
        korean: '매니저가 새로운 정책을 "시행했다."',
        koreanHighlight: "시행했다",
        english: "The manager ___ a new policy.",
        answer: "implemented",
        blankIndex: 2,
      },
      {
        id: "be-4",
        korean: '우리 팀은 매출을 20% "증가시켰다."',
        koreanHighlight: "증가시켰다",
        english: "Our team ___ sales by 20 percent.",
        answer: "increased",
        blankIndex: 2,
      },
      {
        id: "be-5",
        korean: '그는 프로젝트의 "마감일"을 지켰다.',
        koreanHighlight: "마감일",
        english: "He met the project ___.",
        answer: "deadline",
        blankIndex: 4,
      },
      {
        id: "be-6",
        korean: '그들은 계약 조건을 "협상했다."',
        koreanHighlight: "협상했다",
        english: "They ___ the terms of the contract.",
        answer: "negotiated",
        blankIndex: 1,
      },
    ],
  },
  {
    id: "essential-toeic",
    title: "Essential TOEIC",
    description: "High-frequency TOEIC vocabulary",
    icon: "graduation-cap",
    completed: 5,
    total: 25,
    words: [
      {
        id: "et-1",
        korean: '나는 매일 사과를 "먹는다."',
        koreanHighlight: "먹는다",
        english: "I ___ an apple every day.",
        answer: "have",
        blankIndex: 1,
      },
      {
        id: "et-2",
        korean: '그들은 새로운 직원을 "고용했다."',
        koreanHighlight: "고용했다",
        english: "They ___ a new employee.",
        answer: "hired",
        blankIndex: 1,
      },
      {
        id: "et-3",
        korean: '회의는 오후 3시에 "시작된다."',
        koreanHighlight: "시작된다",
        english: "The meeting ___ at 3 PM.",
        answer: "begins",
        blankIndex: 2,
      },
      {
        id: "et-4",
        korean: '고객이 제품에 대해 "불평했다."',
        koreanHighlight: "불평했다",
        english: "The customer ___ about the product.",
        answer: "complained",
        blankIndex: 2,
      },
      {
        id: "et-5",
        korean: '우리는 비용을 "절감해야" 한다.',
        koreanHighlight: "절감해야",
        english: "We must ___ costs.",
        answer: "reduce",
        blankIndex: 2,
      },
      {
        id: "et-6",
        korean: '그녀는 보고서를 "검토했다."',
        koreanHighlight: "검토했다",
        english: "She ___ the report carefully.",
        answer: "reviewed",
        blankIndex: 1,
      },
    ],
  },
  {
    id: "daily-conversation",
    title: "Daily Conversation",
    description: "Everyday English expressions",
    icon: "message-circle",
    completed: 18,
    total: 20,
    words: [
      {
        id: "dc-1",
        korean: '나는 오늘 기분이 정말 "좋다."',
        koreanHighlight: "좋다",
        english: "I feel really ___ today.",
        answer: "great",
        blankIndex: 3,
      },
      {
        id: "dc-2",
        korean: '그는 항상 일찍 "도착한다."',
        koreanHighlight: "도착한다",
        english: "He always ___ early.",
        answer: "arrives",
        blankIndex: 2,
      },
      {
        id: "dc-3",
        korean: '우리는 주말에 영화를 "봤다."',
        koreanHighlight: "봤다",
        english: "We ___ a movie on the weekend.",
        answer: "watched",
        blankIndex: 1,
      },
      {
        id: "dc-4",
        korean: '그녀는 파티에 나를 "초대했다."',
        koreanHighlight: "초대했다",
        english: "She ___ me to the party.",
        answer: "invited",
        blankIndex: 1,
      },
      {
        id: "dc-5",
        korean: '날씨가 정말 "아름답다."',
        koreanHighlight: "아름답다",
        english: "The weather is really ___.",
        answer: "beautiful",
        blankIndex: 4,
      },
      {
        id: "dc-6",
        korean: '나는 매일 아침 커피를 "마신다."',
        koreanHighlight: "마신다",
        english: "I ___ coffee every morning.",
        answer: "drink",
        blankIndex: 1,
      },
    ],
  },
  {
    id: "academic-english",
    title: "Academic English",
    description: "Vocabulary for academic writing",
    icon: "book-open",
    completed: 0,
    total: 20,
    words: [
      {
        id: "ae-1",
        korean: '이 연구는 중요한 결과를 "보여준다."',
        koreanHighlight: "보여준다",
        english: "This study ___ significant results.",
        answer: "demonstrates",
        blankIndex: 2,
      },
      {
        id: "ae-2",
        korean: '데이터는 가설을 "뒷받침한다."',
        koreanHighlight: "뒷받침한다",
        english: "The data ___ the hypothesis.",
        answer: "supports",
        blankIndex: 2,
      },
      {
        id: "ae-3",
        korean: '연구자들은 새로운 방법을 "제안했다."',
        koreanHighlight: "제안했다",
        english: "The researchers ___ a new method.",
        answer: "proposed",
        blankIndex: 2,
      },
      {
        id: "ae-4",
        korean: '이 이론은 현상을 "설명한다."',
        koreanHighlight: "설명한다",
        english: "This theory ___ the phenomenon.",
        answer: "explains",
        blankIndex: 2,
      },
      {
        id: "ae-5",
        korean: '결과를 신중하게 "분석해야" 한다.',
        koreanHighlight: "분석해야",
        english: "We need to ___ the results carefully.",
        answer: "analyze",
        blankIndex: 4,
      },
      {
        id: "ae-6",
        korean: '그 논문은 많은 학자들에 의해 "인용되었다."',
        koreanHighlight: "인용되었다",
        english: "The paper was ___ by many scholars.",
        answer: "cited",
        blankIndex: 3,
      },
    ],
  },
]

export interface UserProgress {
  dailyGoal: number
  dailyCompleted: number
  streak: number
  totalWordsLearned: number
  totalWords: number
}

export const userProgress: UserProgress = {
  dailyGoal: 20,
  dailyCompleted: 14,
  streak: 7,
  totalWordsLearned: 35,
  totalWords: 95,
}
