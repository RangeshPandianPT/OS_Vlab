<div align="center">
  <img alt="OS_VLab banner" src="/assets/gh-banner.png" style="max-width:100%;height:auto;"/>
</div>

# OS_VLab — Operating Systems Virtual Laboratory

A compact, modern set of interactive operating systems simulations and visualizations for learning and teaching OS concepts (CPU scheduling, memory management, disk scheduling, threads & synchronization, deadlocks, and more).

This repository contains a React + TypeScript single-page application built with Vite and Tailwind (CDN config). The UI is mobile-first and supports light/dark themes.

---

## Highlights

- Interactive simulations: CPU scheduling (FCFS, SJF, Priority, RR, MLQ), disk scheduling, memory/paging visualizations, threads & synchronization demos, and deadlock scenarios.
- Mobile-responsive UI with a compact header, collapsible navigation, and accessible interactive cards.
- Designed for educators and students — easy to run locally and extend.

---

## Tech stack

- React 19 + TypeScript
- Vite (dev/build/preview) — fast local dev server
- Tailwind CSS (via CDN config in `index.html`) for utility-first styling
- Recharts (visualization) and lucide-react icons
- Firebase (optional auth and persistence hooks included)

---

## Quick start (local)

Prerequisites: Node.js (LTS) installed.

1. Install dependencies

```powershell
npm install
```

2. Start the dev server

```powershell
npm run dev
```

3. Open the local URL printed by Vite (usually http://localhost:5173) in your browser. The app is responsive — try a narrow viewport or mobile device.

Notes:


## Expanded README — detailed guide

This section expands the quick-start information with configuration notes, project structure, development tips, and deployment guidance. Use this as the canonical reference for working on OS_VLab.

### Project goals

- Provide an educational sandbox for operating systems concepts with interactive simulations and visualizations.
- Remain lightweight and easy to run locally for instructors and students.
- Allow easy extension: each simulation is modular and can be enhanced or added without changing app shell.

### Features

- Interactive CPU scheduling simulations (FCFS, SJF, Priority, Round-Robin, Multi-Level Queue).
- Memory management visualizations (contiguous allocation, paging, TLB behavior).
- Disk scheduling examples (FCFS, SSTF, SCAN, C-SCAN) with step-by-step traces.
- Thread synchronization demos (critical section, semaphores, mutexes) and deadlock scenarios with the Banker's algorithm.
- Theme toggle (light/dark) and mobile-friendly layout.

### Repo layout

Top-level files/folders you will work with:

- `src/` (project root files in this repository):
  - `App.tsx` — top-level app shell and page routing (uses internal `Page` union).
  - `index.html` — head config (Tailwind CDN + fonts) and root container.
  - `index.tsx` — React entry.
  - `components/` — shared UI components (Header, SideNav, Card, Footer, Modals).
  - `pages/` — each page/simulation lives here (CpuSchedulingPage, MemoryManagementPage, TopicsPage, DocsPage, etc.).
  - `hooks/` — small React hooks (theme, auth).
  - `contexts/` — global context providers.
  - `types.ts` — central TypeScript types and the `Page` union.
  - `constants.tsx` — icons, module lists, and small constants.

### Configuration & environment variables

- Firebase: the project includes `firebase.ts` and hooks for authentication. If you want to enable Firebase features (auth, saving simulations), provide your Firebase config via environment variables or edit `firebase.ts` with your project's config. Do not commit secrets.

Suggested env variables (if you add dotenv integration):

- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, etc.

### Development

1. Install dependencies

```powershell
npm install
```

2. Start dev server (fast incremental build)

```powershell
npm run dev
```

3. Open the local URL Vite prints (default: `http://localhost:5173`).

Tips:
- Use the browser devtools device toolbar to test mobile breakpoints.
- The `Header` contains a mobile menu; `SideNav` is hidden on small screens — use the header menu to navigate.

### Production build

```powershell
npm run build
npm run preview
```

`npm run build` outputs to `dist/` (Vite default). Serve this directory with your preferred static host (Netlify, Vercel, GitHub Pages with additional config, or any static server).

### Linting & type checking

This repo currently includes TypeScript and can be extended with ESLint/Prettier. Recommended quick checks before PRs:

```powershell
npm run build   # catches type errors in many setups
```

Or add TypeScript-only check:

```powershell
npx tsc --noEmit
```

### Accessibility notes

- Interactive `Card` components are keyboard-accessible (Enter/Space) and have larger touch targets on mobile.
- Focus outlines are emphasized in the global CSS (`index.css`).

### Adding a new simulation

1. Create a new page under `pages/` (e.g., `MySimulationPage.tsx`) and export a React component.
2. Add the page id to the `Page` union in `types.ts`.
3. Add the page to `App.tsx` render switch and include an entry in `constants.MODULES` for the side nav.
4. Use the shared `Card` and `Modal` components to keep UI consistent.

### Testing & QA

- Manual: use device emulation and test keyboard navigation and contrast in both light/dark modes.
- Automated: consider adding a simple GitHub Action to run `npx tsc --noEmit` and `npm run build` on PRs.

### CI suggestion (example)

Add `.github/workflows/ci.yml` with these steps:
- Checkout
- Install Node
- npm ci
- npx tsc --noEmit
- npm run build

I can add this workflow for you if you'd like.

### Screenshots / assets

If you want screenshots embedded in the README, I can:

- Run the dev server, capture a few responsive screenshots (desktop, tablet, phone), add them to `assets/`, and update the README to reference them.

### Contributing

Please follow these simple rules:

1. Fork the repo and create a topic branch.
2. Keep PRs small and descriptive.
3. Include screenshots and a short description of UI or behavior changes.

If you'd like, I can add a `CONTRIBUTING.md` template and a `CODE_OF_CONDUCT.md`.


## Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — produce optimized production build
- `npm run preview` — serve the built output locally

---

## Contributing

Contributions are welcome. A few suggestions to get started:

1. Open an issue describing the feature or bug.
2. Create a branch named `feat/<short-description>` or `fix/<short-description>`.
3. Keep changes small and focused; add a short test or screenshot when appropriate.
4. Submit a pull request and describe what you changed and why.

For UI work, aim for mobile-first and accessible controls (keyboard focus, sufficient color contrast, and touch targets >= 44px).

---

## Roadmap & ideas

- Add a small CI workflow to run TypeScript checks and a build on pull requests.
- Add interactive guided exercises and auto-graded quizzes for each simulation.
- Add shareable permalinks for simulation states so students can share scenarios.



---

