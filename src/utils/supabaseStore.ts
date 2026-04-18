import { supabase } from "@/supabase";
import type { CurrentUser } from "@/types";

/**
 * Represents a saved simulation state mapped to frontend
 */
export interface SavedSimulation {
  id: string;
  userId: string;
  algorithmType: string;
  name: string;
  description?: string;
  simulationState: Record<string, unknown>;
  ganttChartData?: Record<string, unknown>;
  results?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  isPublic?: boolean;
}

/**
 * Represents a user's quiz progress mapped to frontend
 */
export interface QuizProgress {
  id: string;
  userId: string;
  topic: string;
  attemptNumber: number;
  score: number;
  maxScore: number;
  answers: Record<string, string | boolean | number>;
  updatedAt: string;
}

/**
 * Helper to map snake_case DB row to camelCase frontend interface
 */
function mapSimulationRow(row: any): SavedSimulation {
  return {
    id: row.id,
    userId: row.user_id,
    algorithmType: row.algorithm_type,
    name: row.name,
    description: row.description,
    simulationState: row.simulation_state,
    ganttChartData: row.gantt_chart_data,
    results: row.results,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: row.tags,
    isPublic: row.is_public
  };
}

function mapQuizRow(row: any): QuizProgress {
  return {
    id: row.id,
    userId: row.user_id,
    topic: row.topic,
    attemptNumber: row.attempt_number,
    score: row.score,
    maxScore: row.max_score,
    answers: row.answers,
    updatedAt: row.updated_at
  };
}

/**
 * Save a simulation to Supabase Postgres
 */
export async function saveSimulation(
  user: CurrentUser,
  algorithmType: string,
  name: string,
  simulationState: Record<string, unknown>,
  description?: string,
  ganttChartData?: Record<string, unknown>,
  results?: Record<string, unknown>,
  tags?: string[]
): Promise<string> {
  if (!user) throw new Error("User must be logged in to save simulations.");

  const simulationId = `${Date.now()}-${user.uid.substring(0, 8)}`;

  const { error } = await supabase.from('simulations').insert({
    id: simulationId,
    user_id: user.uid,
    algorithm_type: algorithmType,
    name,
    description,
    simulation_state: simulationState,
    gantt_chart_data: ganttChartData,
    results,
    tags: tags || [],
    is_public: false
  });

  if (error) {
    console.error("Error saving simulation:", error);
    throw new Error("Failed to save simulation. Please try again.");
  }

  return simulationId;
}

export async function loadSimulation(
  user: CurrentUser,
  simulationId: string
): Promise<SavedSimulation | null> {
  if (!user) throw new Error("User must be logged in.");

  const { data, error } = await supabase
    .from('simulations')
    .select('*')
    .eq('id', simulationId)
    .eq('user_id', user.uid)
    .single();

  if (error && error.code !== 'PGRST116') {
      console.error("Error loading simulation:", error);
      throw new Error("Failed to load simulation.");
  }
  return data ? mapSimulationRow(data) : null;
}

export async function loadUserSimulations(
  user: CurrentUser,
  algorithmType?: string
): Promise<SavedSimulation[]> {
  if (!user) throw new Error("User must be logged in.");

  let query = supabase.from('simulations').select('*').eq('user_id', user.uid);
  
  if (algorithmType) {
    query = query.eq('algorithm_type', algorithmType);
  }

  const { data, error } = await query.order('updated_at', { ascending: false });

  if (error) {
    console.error("Error loading user simulations:", error);
    throw new Error("Failed to load saved simulations.");
  }
  return (data || []).map(mapSimulationRow);
}

export async function deleteSimulation(
  user: CurrentUser,
  simulationId: string
): Promise<void> {
  if (!user) throw new Error("User must be logged in.");
  
  const { error } = await supabase
    .from('simulations')
    .delete()
    .eq('id', simulationId)
    .eq('user_id', user.uid);

  if (error) {
      console.error("Error deleting simulation:", error);
      throw new Error("Failed to delete simulation.");
  }
}

export async function updateSimulation(
  user: CurrentUser,
  simulationId: string,
  updates: Partial<SavedSimulation>
): Promise<void> {
  if (!user) throw new Error("User must be logged in.");
  
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.simulationState !== undefined) payload.simulation_state = updates.simulationState;
  if (updates.ganttChartData !== undefined) payload.gantt_chart_data = updates.ganttChartData;
  if (updates.results !== undefined) payload.results = updates.results;
  if (updates.tags !== undefined) payload.tags = updates.tags;
  if (updates.isPublic !== undefined) payload.is_public = updates.isPublic;
  payload.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('simulations')
    .update(payload)
    .eq('id', simulationId)
    .eq('user_id', user.uid);

  if (error) {
      console.error("Error updating simulation:", error);
      throw new Error("Failed to update simulation.");
  }
}

export async function saveQuizProgress(
  user: CurrentUser,
  topic: string,
  score: number,
  maxScore: number,
  answers: Record<string, string | boolean | number>
): Promise<string> {
  if (!user) throw new Error("User must be logged in.");

  const existingProgress = await getQuizProgress(user, topic);
  const attemptNumber = existingProgress ? existingProgress.attemptNumber + 1 : 1;
  const progressId = `${topic}-${attemptNumber}`;

  const { error } = await supabase.from('quiz_progress').insert({
    id: progressId,
    user_id: user.uid,
    topic,
    attempt_number: attemptNumber,
    score,
    max_score: maxScore,
    answers
  });

  if (error) {
      console.error("Error saving quiz progress:", error);
      throw new Error("Failed to save quiz progress.");
  }
  return progressId;
}

export async function getQuizProgress(
  user: CurrentUser,
  topic: string
): Promise<QuizProgress | null> {
  if (!user) throw new Error("User must be logged in.");

  const { data, error } = await supabase
    .from('quiz_progress')
    .select('*')
    .eq('user_id', user.uid)
    .eq('topic', topic)
    .order('attempt_number', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
      console.error("Error getting quiz progress:", error);
      throw new Error("Failed to get quiz progress.");
  }
  return data ? mapQuizRow(data) : null;
}

export async function getUserQuizProgress(user: CurrentUser): Promise<QuizProgress[]> {
  if (!user) throw new Error("User must be logged in.");

  const { data, error } = await supabase
    .from('quiz_progress')
    .select('*')
    .eq('user_id', user.uid)
    .order('updated_at', { ascending: false });

  if (error) {
      console.error("Error fetching user quiz progress:", error);
      throw new Error("Failed to get quiz progress.");
  }
  return (data || []).map(mapQuizRow);
}
