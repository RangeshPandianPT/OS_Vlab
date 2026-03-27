import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  Timestamp,
} from "firebase/firestore";
import type { User } from "firebase/auth";

/**
 * Represents a saved simulation state in Firestore
 */
export interface SavedSimulation {
  id: string;
  userId: string;
  algorithmType: string; // e.g., "cpu-scheduling", "memory-management"
  name: string;
  description?: string;
  simulationState: Record<string, unknown>; // The actual simulation state
  ganttChartData?: Record<string, unknown>; // Gantt chart data if applicable
  results?: Record<string, unknown>; // Simulation results
  createdAt: Timestamp;
  updatedAt: Timestamp;
  tags?: string[]; // For categorizing simulations
  isPublic?: boolean; // Whether other users can access
}

/**
 * Represents a user's quiz progress
 */
export interface QuizProgress {
  id: string;
  userId: string;
  topic: string;
  attemptNumber: number;
  score: number;
  maxScore: number;
  answers: Record<string, string | boolean | number>;
  updatedAt: Timestamp;
}

/**
 * Get or initialize a reference to Firestore
 */
function getDb() {
  try {
    return getFirestore();
  } catch (error) {
    console.error("Firestore not initialized:", error);
    throw new Error("Firestore is not initialized. Please check your Firebase configuration.");
  }
}

/**
 * Save a simulation to Firestore
 */
export async function saveSimulation(
  user: User,
  algorithmType: string,
  name: string,
  simulationState: Record<string, unknown>,
  description?: string,
  ganttChartData?: Record<string, unknown>,
  results?: Record<string, unknown>,
  tags?: string[]
): Promise<string> {
  if (!user) {
    throw new Error("User must be logged in to save simulations.");
  }

  const db = getDb();
  const simulationId = `${Date.now()}-${user.uid.substring(0, 8)}`;

  const savedSimulation: SavedSimulation = {
    id: simulationId,
    userId: user.uid,
    algorithmType,
    name,
    description,
    simulationState,
    ganttChartData,
    results,
    tags: tags || [],
    isPublic: false,
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
  };

  try {
    await setDoc(
      doc(db, "users", user.uid, "simulations", simulationId),
      savedSimulation
    );
    return simulationId;
  } catch (error) {
    console.error("Error saving simulation:", error);
    throw new Error("Failed to save simulation. Please try again.");
  }
}

/**
 * Load a specific simulation by ID
 */
export async function loadSimulation(
  user: User,
  simulationId: string
): Promise<SavedSimulation | null> {
  if (!user) {
    throw new Error("User must be logged in to load simulations.");
  }

  const db = getDb();

  try {
    const docSnap = await getDoc(
      doc(db, "users", user.uid, "simulations", simulationId)
    );

    if (docSnap.exists()) {
      return docSnap.data() as SavedSimulation;
    }
    return null;
  } catch (error) {
    console.error("Error loading simulation:", error);
    throw new Error("Failed to load simulation. Please try again.");
  }
}

/**
 * Get all simulations for the logged-in user
 */
export async function loadUserSimulations(
  user: User,
  algorithmType?: string
): Promise<SavedSimulation[]> {
  if (!user) {
    throw new Error("User must be logged in to load simulations.");
  }

  const db = getDb();

  try {
    let q;
    if (algorithmType) {
      q = query(
        collection(db, "users", user.uid, "simulations"),
        where("algorithmType", "==", algorithmType)
      );
    } else {
      q = collection(db, "users", user.uid, "simulations");
    }

    const querySnapshot = await getDocs(q as any);
    const simulations: SavedSimulation[] = [];

    querySnapshot.forEach((doc) => {
      simulations.push(doc.data() as SavedSimulation);
    });

    // Sort by updatedAt (most recent first)
    simulations.sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis());
    return simulations;
  } catch (error) {
    console.error("Error loading user simulations:", error);
    throw new Error("Failed to load saved simulations. Please try again.");
  }
}

/**
 * Delete a simulation
 */
export async function deleteSimulation(
  user: User,
  simulationId: string
): Promise<void> {
  if (!user) {
    throw new Error("User must be logged in to delete simulations.");
  }

  const db = getDb();

  try {
    await deleteDoc(
      doc(db, "users", user.uid, "simulations", simulationId)
    );
  } catch (error) {
    console.error("Error deleting simulation:", error);
    throw new Error("Failed to delete simulation. Please try again.");
  }
}

/**
 * Update a simulation
 */
export async function updateSimulation(
  user: User,
  simulationId: string,
  updates: Partial<SavedSimulation>
): Promise<void> {
  if (!user) {
    throw new Error("User must be logged in to update simulations.");
  }

  const db = getDb();

  try {
    await updateDoc(
      doc(db, "users", user.uid, "simulations", simulationId),
      {
        ...updates,
        updatedAt: serverTimestamp(),
      }
    );
  } catch (error) {
    console.error("Error updating simulation:", error);
    throw new Error("Failed to update simulation. Please try again.");
  }
}

/**
 * Save quiz progress for a user
 */
export async function saveQuizProgress(
  user: User,
  topic: string,
  score: number,
  maxScore: number,
  answers: Record<string, string | boolean | number>
): Promise<string> {
  if (!user) {
    throw new Error("User must be logged in to save quiz progress.");
  }

  const db = getDb();

  try {
    // Get existing progress for this topic
    const existingProgress = await getQuizProgress(user, topic);
    const attemptNumber = existingProgress ? existingProgress.attemptNumber + 1 : 1;

    const progressId = `${topic}-${attemptNumber}`;

    const quizProgress: QuizProgress = {
      id: progressId,
      userId: user.uid,
      topic,
      attemptNumber,
      score,
      maxScore,
      answers,
      updatedAt: serverTimestamp() as any,
    };

    await setDoc(
      doc(db, "users", user.uid, "quizProgress", progressId),
      quizProgress
    );

    return progressId;
  } catch (error) {
    console.error("Error saving quiz progress:", error);
    throw new Error("Failed to save quiz progress. Please try again.");
  }
}

/**
 * Get the latest quiz progress for a topic
 */
export async function getQuizProgress(
  user: User,
  topic: string
): Promise<QuizProgress | null> {
  if (!user) {
    throw new Error("User must be logged in to get quiz progress.");
  }

  const db = getDb();

  try {
    const q = query(
      collection(db, "users", user.uid, "quizProgress"),
      where("topic", "==", topic)
    );

    const querySnapshot = await getDocs(q);
    let latestProgress: QuizProgress | null = null;

    querySnapshot.forEach((doc) => {
      const progress = doc.data() as QuizProgress;
      if (!latestProgress || progress.attemptNumber > latestProgress.attemptNumber) {
        latestProgress = progress;
      }
    });

    return latestProgress;
  } catch (error) {
    console.error("Error getting quiz progress:", error);
    throw new Error("Failed to get quiz progress. Please try again.");
  }
}

/**
 * Get all quiz progress for a user
 */
export async function getUserQuizProgress(user: User): Promise<QuizProgress[]> {
  if (!user) {
    throw new Error("User must be logged in to get quiz progress.");
  }

  const db = getDb();

  try {
    const q = collection(db, "users", user.uid, "quizProgress");
    const querySnapshot = await getDocs(q as any);
    const progress: QuizProgress[] = [];

    querySnapshot.forEach((doc) => {
      progress.push(doc.data() as QuizProgress);
    });

    return progress;
  } catch (error) {
    console.error("Error getting quiz progress:", error);
    throw new Error("Failed to get quiz progress. Please try again.");
  }
}
