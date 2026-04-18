# OS_VLab — Operating Systems Virtual Laboratory

A modern, interactive set of operating systems simulations and visualizations designed to make learning and teaching OS concepts intuitive and engaging. Features include interactive simulations for CPU scheduling, memory management, disk scheduling, threads & synchronization, and deadlocks.

This repository contains a React + TypeScript single-page application built with Vite and Tailwind CSS. The UI is mobile-first, highly responsive, and supports light/dark themes.

---

## 🌟 Highlights

- **Interactive Simulations**: CPU scheduling (FCFS, SJF, Priority, RR, MLQ), disk scheduling, memory/paging visualizations, threads & synchronization demos, and deadlock scenarios.
- **Fluid Visualizations**: Educational UI enhanced with `framer-motion` to provide smooth, dynamic layout changes and Gantt Chart timeline growth to better understand algorithmic shifts.
- **Integrated Quizzes & Progress Tracking**: Every module features a contextual quiz to test student understanding, with scores aggregated on a personalized "Progress Page."
- **Persistent States & Sharing**: Users can save simulation states to the cloud (Supabase) and share exact simulation configurations via permalinks.
- **Mobile-Responsive UI**: Features a compact header, collapsible navigation, accessible interactive cards, and a robust light/dark theme toggle.
- **Optimized Performance**: Built with Vite for rapid local development and optimized production asset chunking.

---

## 🛠 Tech Stack

- **React 19 + TypeScript**: Modern, type-safe functional components.
- **Vite**: Ultra-fast dev server and production chunking/builds.
- **Tailwind CSS**: Utility-first styling with integrated dark mode.
- **Recharts & Framer-Motion**: Used for beautiful metrics charts and fluid UI animations.
- **Supabase**: Backend-as-a-Service for persistent simulation saving, user auth, and quiz progress tracking.

---

## 🚀 Quick Start (Local)

Prerequisites: Node.js (LTS) installed.

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory and add your Supabase credentials. See `.env.example` for the required format:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Start the Dev Server

```bash
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`) in your browser. 

---

## 📂 Project Structure

Top-level files/folders you will work with:

- `src/` (project root files in this repository):
  - `App.tsx` — top-level app shell and page routing (uses internal `Page` union).
  - `index.html` — head config (Tailwind CDN + fonts) and root container.
  - `index.tsx` — React entry.
  - `components/` — shared UI components (Header, SideNav, Card, Footer, Modals).
  - `pages/` — each page/simulation lives here (CpuSchedulingPage, MemoryManagementPage, ProgressPage, etc.).
  - `hooks/` — small React hooks (theme, auth, simulation saver, permalinks).
  - `contexts/` — global context providers.
  - `types.ts` — central TypeScript typings.
  - `constants.tsx` — icons, module lists, and small constants.
  - `supabase.ts` & `utils/supabaseStore.ts` — Supabase client generation and data utilities.

---

## 🛠 Development

### Production build

```bash
npm run build
npm run preview
```

`npm run build` outputs to `dist/` and runs the TypeScript compiler against your codebase. Serve this directory with your preferred static host (Netlify, Vercel, GitHub Pages).

### Linting & Type Checking

This repo relies strictly on TypeScript for static type checking. Check for typing errors before submitting pull requests:

```bash
npx tsc --noEmit
```

---

## 🤝 Contributing

Contributions are welcome. A few suggestions to get started:

1. Open an issue describing the feature or bug.
2. Fork the repo and create a branch named `feat/<short-description>` or `fix/<short-description>`.
3. Keep changes small and focused; add a short test or screenshot when appropriate.
4. Submit a pull request and describe what you changed and why.

For UI work, aim for mobile-first and accessible controls (keyboard focus, sufficient color contrast, and touch targets >= 44px).

### Adding a new simulation

1. Create a new page under `pages/` (e.g., `MySimulationPage.tsx`) and export a React component.
2. Add the page id to the `Page` union in `types.ts`.
3. Add the page to `App.tsx` render switch and include an entry in `constants.MODULES` for the side nav.
4. Integrate the `SaveSimulationModal` for saving states and `QuizModal` for educational quizzes to maintain consistency.

---

## 📍 Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — produce optimized production build
- `npm run preview` — serve the built output locally
