# WordFlow: Language Learning Platform

WordFlow is a high-performance, language-learning web application built with a modern Next.js stack. It features interactive learning sessions, progress tracking with daily goals and streaks, and a local-first persistence layer for offline-resilient progress.

## Installation

이 프로젝트는 프론트엔드와 백엔드로 나뉘어 있으며, 각각 의존성을 설치해야 합니다.

### 1. 프론트엔드 (Root Directory)
프론트엔드는 **pnpm**을 권장합니다. 루트 디렉토리에서 다음 명령어를 실행하세요.
```bash
pnpm install
```

### 2. 백엔드 (backend 폴더)
백엔드 폴더(`backend`)로 이동하여 의존성을 설치합니다.
```bash
cd backend
npm install
cd ..
```

---

## Running the Application

### 1. Start the Mock Backend
백엔드 서버를 실행합니다 (`http://localhost:3001`).
```bash
cd backend
node server.js
```

### 2. Start the Frontend
프론트엔드 개발 서버를 실행합니다 (`http://localhost:3000`).
```bash
pnpm dev
```

### Building for Production
```bash
pnpm build
pnpm start
```

## Project Overview

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS v4, Radix UI (via shadcn/ui).
- **Backend:** Mock backend powered by `json-server` (running on `http://localhost:3001`).
- **Core Features:**
    - **Dashboard:** Personalized progress tracking, daily goals, and streak management.
    - **Word Decks:** Categorized vocabulary (Business English, TOEIC, Daily Conversation, Academic English).
    - **Interactive Sessions:** Contextual sentence-completion learning with hint and validation logic.
    - **Offline Sync:** Local-first state management with background synchronization via `lib/api.ts`.
    - **Mock Auth:** Signup and Login system with mock JWT token generation.

## Development Conventions

- **Architecture:** Follows Next.js App Router patterns with logic separated into custom hooks (`hooks/`) and API utilities (`lib/`).
- **Styling:** Uses **Tailwind CSS v4** with CSS variables for theming. Adheres to shadcn/ui component patterns.
- **Component Organization:**
    - `components/ui/`: Base shadcn/ui components.
    - `components/dashboard/`, `components/learning/`, `components/auth/`: Feature-specific components.
- **State Management:**
    - **Local State:** `useState` and `useReducer` within components and hooks.
    - **API Integration:** Centralized in `lib/api.ts` with local persistence logic.
- **Persistence:** Progress is saved to `localStorage` first (`flow_progress_[deckId]`) and then synced to the backend in the background to ensure no data loss.
- **Icons:** Powered by `lucide-react`.

## Key Files

- `app/page.tsx`: Main dashboard with progress visualization and deck library.
- `app/learn/[deckId]/page.tsx`: Learning session entry point.
- `hooks/use-learning-session.ts`: Core state machine for the learning experience (idle, validating, correct, incorrect, hint, complete).
- `lib/api.ts`: API client with background sync logic.
- `backend/server.js`: Mock API server with session management and auth logic.
- `backend/db.json`: Local mock database storage.
