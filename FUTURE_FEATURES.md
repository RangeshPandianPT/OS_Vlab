# Future Features and Issue Templates for OS VLab

This document contains detailed descriptions and task lists for upcoming features planned for the OS VLab project. These can be directly copied and pasted into new GitHub issues.

## 1. Feature: Interactive Guided Exercises and Quizzes
**Title:** `feat: Add interactive quizzes and guided exercises for simulations`
**Description:**
```markdown
### Description
To enhance the educational value of OS VLab, we need to introduce interactive quizzes and guided exercises. After users interact with a simulation (like CPU Scheduling or Memory Management), they should be able to test their understanding through auto-graded quizzes.

### Tasks
- [ ] Define a standard JSON schema to store quiz questions (e.g., matching definitions, multiple-choice, true/false).
- [ ] Create a reusable `QuizModal` or `QuizBanner` React component to display questions without leaving the simulation page.
- [ ] Write 3-5 comprehensive questions for each major simulation topic (CPU Scheduling, Disk Scheduling, Memory Allocation, Synchronization).
- [ ] Implement a scoring/feedback system that dynamically explains why an answer was correct or incorrect (potentially integrating the existing Gemini AI Tutor).
- [ ] Add a visual indicator on the sidebar or specific simulation pages showing completion status.

### Expected Outcome
Students can optionally test their knowledge right inside the lab, resulting in a more active and engaging learning experience.
```

## 2. Feature: Shareable Permalinks for Simulation States
**Title:** `feat: Implement shareable permalinks for simulation states`
**Description:**
```markdown
### Description
Currently, if an instructor creates a specific edge-case scenario (e.g., a specific set of processes that cause a deadlock, or a specific disk queue), they cannot easily share it with students. We need the ability to encode the simulation state into the URL so it can be shared.

### Tasks
- [ ] Create a utility function to serialize a simulation's React state (processes, burst times, memory blocks, etc.) into a base64 encoded string or URL query parameters.
- [ ] Create a utility function to deserialize the URL state back into the initial React state on page load.
- [ ] Add a "Share Simulation" button to the unified `Card` component or page headers.
- [ ] Ensure that when a user clicks the share button, the URL is copied to their clipboard and they receive a toast notification.
- [ ] Handle error states (e.g., if the user modifies the URL and the deserialized state is invalid, it should gracefully fall back to default values).

### Expected Outcome
Users can configure a complex visual scenario and easily share the exact setup with others via a single link.
```

## 3. Feature: Automated CI/CD Pipeline
**Title:** `build: Add GitHub Actions CI workflow for pull requests`
**Description:**
```markdown
### Description
To maintain code quality and ensure the project remains stable as more contributors join, we need an automated Continuous Integration (CI) pipeline that runs whenever a Pull Request is opened or updated.

### Tasks
- [ ] Create basic workflow definition `.github/workflows/ci.yml`.
- [ ] Setup the workflow to trigger on `push` to `master` and on `pull_request` targeting `master`.
- [ ] Add a step to run `npm ci` for clean dependency installation.
- [ ] Add a step to run strict TypeScript type checking (`npx tsc --noEmit`).
- [ ] Add a step to run the Vite production build (`npm run build`) to catch any bundler or import issues.
- [ ] Link the required status checks in the GitHub repository settings.

### Expected Outcome
Every pull request is automatically verified for correct types and successful builds before it is allowed to merge, preventing broken code from entering the main branch.
```

## 4. Feature: Firebase Authentication and Saved Progress
**Title:** `feat: Implement Firebase Auth to save user progress`
**Description:**
```markdown
### Description
The project currently has Firebase dependencies set up in `firebase.ts` but the UI does not have a comprehensive login/signup flow. Enabling this will allow users to save their settings and quiz progress.

### Tasks
- [ ] Build a `LoginModal` and `SignupModal` component.
- [ ] Integrate Firebase Auth methods (Google Sign-in, Email/Password).
- [ ] Create a React Context or Zustand store to manage global authentication state.
- [ ] Create a Firestore schema to link users to their saved simulation states and theoretical quiz scores.
- [ ] Update the `Header` component to display the user's avatar/email when logged in.
```

## 5. Feature: Multi-Level Queue (MLQ) Enhancements
**Title:** `feat: Enhance MLQ simulation with dynamic queue priority configuration`
**Description:**
```markdown
### Description
The CPU Scheduling simulation currently supports Multi-Level Queue (MLQ) scheduling, but users cannot easily drag-and-drop to reorder queue priorities or dynamically add new queues with custom algorithms (e.g., mixing Round Robin and FCFS arbitrarily). 

### Tasks
- [ ] Implement drag-and-drop capability for the Queue lists using `framer-motion` or `@dnd-kit/core`.
- [ ] Add a UI control allowing users to select which specific scheduling algorithm applies to each queue tier.
- [ ] Update the internal scheduling logic to handle arbitrarily nested algorithms.
- [ ] Ensure the Gantt Chart component correctly distinguishes between process execution from different queues (e.g., using different color palettes per queue).
```
