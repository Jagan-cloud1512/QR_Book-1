# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LibrisLink (BIBLIO-SYNC)** — A QR-based book reservation and inventory management system built for library/institutional use. Features Excel import, shelf matrix configuration, QR code generation for mobile syncing, and real-time Firestore sync with localStorage fallback.

Originally scaffolded via Google AI Studio (uses Gemini API capability via `metadata.json`).

## Commands

- `npm run dev` — Start Vite dev server on port 3000
- `npm run build` — Production build
- `npm run lint` — TypeScript type-check only (`tsc --noEmit`), no ESLint
- `npm run preview` — Preview production build

## Architecture

Single-page React app (React 19) with Vite, Tailwind CSS v4, and Firebase Firestore.

### Data Flow

- **Dual persistence**: All data operations write to both Firestore (if connected) and localStorage. Firestore is primary when configured; localStorage is always kept in sync as fallback.
- **Real-time updates**: `subscribeToInventory` uses Firestore `onSnapshot` for live data. In fallback mode, a custom DOM event (`librislink_data_updated`) provides reactivity across components.
- **Per-user collections**: Each user's data lives in a Firestore collection named `user_{username}`, with a `_shelf_matrix` doc for config and individual docs per book by `bookId`.

### Key Files

- `src/services/firebase.ts` — All data logic: Firebase init, auth (bcryptjs hashing, not Firebase Auth), CRUD operations, real-time subscriptions, localStorage fallback
- `src/types.ts` — Shared TypeScript interfaces (`BookRecord`, `ShelfMatrixMetadata`, `QRCodePayload`, etc.)
- `src/App.tsx` — Root component managing auth state, tab routing, and Firestore subscription lifecycle

### Components (in `src/components/`)

- `AuthScreen` — Login/signup with bcrypt password hashing and quick demo mode (`admin_demo` / `password123`)
- `ModuleInventory` — Real-time book table with search, reservation simulation, queue management
- `ModuleImportConfig` — Excel/CSV drag-and-drop import (via `xlsx` lib) + shelf matrix row/col configurator
- `ModuleQRCode` — QR code generator (via `qrcode` lib) encoding JSON payload for mobile app pairing
- `FirebaseConfigModal` — Runtime Firebase config editor (saved to localStorage)
- `AddBookModal` — Manual single-book entry form

### Authentication

Custom auth (not Firebase Auth): usernames stored in Firestore `users` collection or localStorage, passwords hashed with bcryptjs (salt rounds: 10). No session tokens — user state is held in React state only.

## Tech Stack

- React 19 + TypeScript 5.8
- Vite 6 with `@tailwindcss/vite` plugin (Tailwind v4, no `tailwind.config` file)
- Firebase Firestore (client SDK, no server-side)
- `xlsx` for spreadsheet parsing
- `qrcode` for QR generation (canvas + data URL + SVG)
- `lucide-react` for icons
- `motion` (Framer Motion) for animations
- `bcryptjs` for password hashing

## Styling

Dark-only UI. Colors: emerald-500 accent on near-black (#050505) backgrounds. Uses utility classes `.glass` and `.code-font` defined in `src/index.css`. Path alias `@/` maps to project root.

## Environment

Requires `GEMINI_API_KEY` in `.env.local` for AI Studio integration (see `.env.example`). Firebase config is hardcoded as default in `firebase.ts` but can be overridden at runtime via the Firebase Config modal (persisted in localStorage under `librislink_firebase_config`).
