# Firebase Authentication & Saved Progress Implementation

This document outlines the Firebase integration for OS VLab, enabling user authentication and persistent storage of simulation progress.

## Overview

The Firebase implementation includes:
- ✅ Authentication (Email/Password & Google Sign-in)
- ✅ Firestore database for storing simulations and quiz progress
- ✅ User-specific data isolation
- ✅ Offline support with localStorage fallback

## Files Added

### Core Utilities
- **`utils/firestoreUtils.ts`** - Firestore database operations
  - `saveSimulation()` - Save simulation state to Firestore
  - `loadSimulation()` - Load specific simulation
  - `loadUserSimulations()` - Get all user simulations
  - `deleteSimulation()` - Delete saved simulation
  - `updateSimulation()` - Update existing simulation
  - `saveQuizProgress()` - Save quiz attempt
  - `getQuizProgress()` - Get latest quiz progress for a topic
  - `getUserQuizProgress()` - Get all quiz progress for user

### Custom Hooks
- **`hooks/useSimulationSaver.ts`** - React hook for managing saved simulations
  - Provides state management for simulations
  - Handles loading, saving, deleting, and updating simulations
  - Automatic refresh and error handling
  
- **`hooks/useQuizProgress.ts`** - Enhanced with Firestore integration
  - Saves quiz progress to both localStorage and Firestore
  - Loads quiz history from Firestore
  - Dual-mode storage (offline + cloud)

### Components
- **`components/SaveSimulationModal.tsx`** - Reusable modal for saving simulations
  - Allows users to name and describe simulations
  - Add tags for organization
  - Show what data is being saved
  - Confirmation and error handling

### Pages
- **`pages/SavedSimulationsPage.tsx`** - Full implementation for browsing saved simulations
  - Filter by algorithm type
  - View simulation details
  - Delete saved simulations
  - Refresh functionality
  - Requires login to access

### Integration
- **`pages/CpuSchedulingPage.tsx`** - Added save button in simulation results
  - "Save" button when simulation is complete
  - SaveSimulationModal integration
  - Captures simulation state, gantt data, and results

## Firestore Database Schema

### Collection: `users/{userId}/simulations`
```json
{
  "id": "string",
  "userId": "string",
  "algorithmType": "string",
  "name": "string",
  "description": "string",
  "simulationState": "object",
  "ganttChartData": "object",
  "results": "object",
  "tags": "string[]",
  "isPublic": "boolean",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Collection: `users/{userId}/quizProgress`
```json
{
  "id": "string",
  "userId": "string",
  "topic": "string",
  "attemptNumber": "number",
  "score": "number",
  "maxScore": "number",
  "answers": "object",
  "updatedAt": "timestamp"
}
```

## Setup Instructions

### 1. Configure Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Authentication:
   - Email/Password
   - Google Sign-in
4. Enable Firestore Database
5. Create security rules

### 2. Update Firebase Configuration
Edit `firebase.ts` with your Firebase project credentials:
```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Set Firestore Security Rules
```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write to user's own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

### 4. Set Authentication Rules
In Firebase Console:
1. Go to Authentication > Sign-in method
2. Enable Email/Password
3. Enable Google (add OAuth credentials)
4. Configure authorized domains

## Usage Examples

### Save a Simulation
```typescript
const { saveSimulation } = useSavedSimulations();

await saveSimulation(
  'cpu-scheduling',
  'FCFS vs RR Comparison',
  simulationState,
  'Comparing scheduling algorithms',
  ganttChartData,
  results,
  ['important', 'comparison']
);
```

### Load User's Simulations
```typescript
const { simulations, loading } = useSavedSimulations(true);

simulations.forEach(sim => {
  console.log(`${sim.name} (${sim.algorithmType})`);
});
```

### Save Quiz Progress
```typescript
const { saveProgress } = useQuizProgress('cpu-scheduling');

const progressId = await saveProgress(
  'cpu-scheduling',
  85,
  100,
  { q1: 'a', q2: 'b' }
);
```

## Features

✅ **Persistent Storage** - Simulations saved to Firestore
✅ **User Isolation** - Each user sees only their own data
✅ **Offline Support** - Quiz progress saved locally + to Firestore
✅ **Metadata Tracking** - Creation time, last update, tags
✅ **Easy Retrieval** - Filter by algorithm type
✅ **Error Handling** - Graceful error messages
✅ **Loading States** - Visual feedback during operations
✅ **Delete Capability** - Remove unwanted simulations

## Future Enhancements

- [ ] Load saved simulations into simulation page
- [ ] Compare multiple saved simulations
- [ ] Share simulations with other users
- [ ] Export saved simulations
- [ ] Archive old simulations
- [ ] User profile page
- [ ] Leaderboards

## Troubleshooting

### "Firebase is not configured"
- Check that `firebase.ts` has valid credentials
- Ensure Firebase project is active

### "Permission denied" errors
- Check Firestore security rules
- Verify user is authenticated
- Ensure rules allow user to access `/users/{uid}/...`

### Simulations not loading
- Check browser console for errors
- Verify Firestore has data in the collection
- Confirm user is logged in
- Check network connectivity

## Next Steps

1. **Add to other simulation pages**: Repeat the CpuSchedulingPage pattern for:
   - Memory Management
   - Disk Scheduling
   - Page Replacement
   - Process Management
   - Deadlock
   - Threads & Synchronization

2. **Implement load functionality**: Allow users to restore and resume saved simulations

3. **Add comparison feature**: Compare multiple saved simulations side-by-side

4. **Analytics**: Track which algorithms are most popular, average scores, etc.

## Dependencies

- `firebase@^12.5.0` - Already in package.json
- `react@^19.2.0` - For hooks
- `lucide-react@^0.552.0` - For icons

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    OS VLab App                          │
└─────────────────────────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
    ┌────▼─────┐    ┌──────▼─────┐   ┌──────▼─────┐
    │Simulation │    │SaveSim     │   │SavedSimsPage
    │Pages      │    │Modal       │   │            │
    └────┬──────┘    └──────┬──────┘   └──────┬────┘
         │                  │                  │
         └──────────────────┼──────────────────┘
                            │
                 ┌──────────▼──────────┐
                 │useSavedSimulations  │
                 │useQuizProgress      │
                 └──────────┬──────────┘
                            │
                 ┌──────────▼──────────┐
                 │firestoreUtils.ts    │
                 └──────────┬──────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
    ┌────▼──────┐   ┌───────▼────┐   ┌───────▼────┐
    │Firebase   │   │Firestore   │   │Auth State  │
    │Auth       │   │Database    │   │Listener    │
    └───────────┘   └────────────┘   └────────────┘
```

## Support

For issues or questions:
1. Check Firebase Console for errors
2. Review browser console for error messages
3. Check Firestore security rules
4. Verify network connectivity
