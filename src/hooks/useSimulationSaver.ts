import { useState, useCallback, useEffect } from "react";
import { useAuth } from "./useAuth";
import {
  saveSimulation as supabaseSaveSimulation,
  loadSimulation,
  loadUserSimulations,
  deleteSimulation as supabaseDeleteSimulation,
  updateSimulation as supabaseUpdateSimulation,
  type SavedSimulation,
} from "../utils/supabaseStore";

interface UseSavedSimulationsReturn {
  simulations: SavedSimulation[];
  loading: boolean;
  error: string | null;
  saveSimulation: (
    algorithmType: string,
    name: string,
    simulationState: Record<string, unknown>,
    description?: string,
    ganttChartData?: Record<string, unknown>,
    results?: Record<string, unknown>,
    tags?: string[]
  ) => Promise<string>;
  loadSimulationById: (simulationId: string) => Promise<SavedSimulation | null>;
  refreshSimulations: (algorithmType?: string) => Promise<void>;
  deleteSimulation: (simulationId: string) => Promise<void>;
  updateSimulation: (
    simulationId: string,
    updates: Partial<SavedSimulation>
  ) => Promise<void>;
}

/**
 * Hook for managing saved simulations for the current user
 */
export function useSavedSimulations(
  autoLoad: boolean = true,
  algorithmType?: string
): UseSavedSimulationsReturn {
  const { currentUser } = useAuth();
  const [simulations, setSimulations] = useState<SavedSimulation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load simulations on mount or when dependencies change
  useEffect(() => {
    if (autoLoad && currentUser) {
      refreshSimulations(algorithmType);
    }
  }, [currentUser, autoLoad, algorithmType]);

  const refreshSimulations = useCallback(
    async (type?: string) => {
      if (!currentUser) {
        setError("User not logged in");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const loadedSimulations = await loadUserSimulations(currentUser, type || algorithmType);
        setSimulations(loadedSimulations);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        console.error("Error refreshing simulations:", err);
      } finally {
        setLoading(false);
      }
    },
    [currentUser, algorithmType]
  );

  const saveSimulation = useCallback(
    async (
      algorithmType: string,
      name: string,
      simulationState: Record<string, unknown>,
      description?: string,
      ganttChartData?: Record<string, unknown>,
      results?: Record<string, unknown>,
      tags?: string[]
    ): Promise<string> => {
      if (!currentUser) {
        throw new Error("User not logged in");
      }

      setError(null);

      try {
        const simulationId = await supabaseSaveSimulation(
          currentUser,
          algorithmType,
          name,
          simulationState,
          description,
          ganttChartData,
          results,
          tags
        );

        // Refresh the list
        await refreshSimulations(algorithmType);
        return simulationId;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        throw err;
      }
    },
    [currentUser, refreshSimulations]
  );

  const loadSimulationById = useCallback(
    async (simulationId: string): Promise<SavedSimulation | null> => {
      if (!currentUser) {
        throw new Error("User not logged in");
      }

      setError(null);

      try {
        const simulation = await loadSimulation(currentUser, simulationId);
        return simulation;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        throw err;
      }
    },
    [currentUser]
  );

  const deleteSimulation = useCallback(
    async (simulationId: string): Promise<void> => {
      if (!currentUser) {
        throw new Error("User not logged in");
      }

      setError(null);

      try {
        await supabaseDeleteSimulation(currentUser, simulationId);
        // Update local state
        setSimulations((prev) =>
          prev.filter((sim) => sim.id !== simulationId)
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        throw err;
      }
    },
    [currentUser]
  );

  const updateSimulation = useCallback(
    async (
      simulationId: string,
      updates: Partial<SavedSimulation>
    ): Promise<void> => {
      if (!currentUser) {
        throw new Error("User not logged in");
      }

      setError(null);

      try {
        await supabaseUpdateSimulation(currentUser, simulationId, updates);
        // Update local state
        setSimulations((prev) =>
          prev.map((sim) =>
            sim.id === simulationId ? { ...sim, ...updates } : sim
          )
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        throw err;
      }
    },
    [currentUser]
  );

  return {
    simulations,
    loading,
    error,
    saveSimulation,
    loadSimulationById,
    refreshSimulations,
    deleteSimulation,
    updateSimulation,
  };
}
