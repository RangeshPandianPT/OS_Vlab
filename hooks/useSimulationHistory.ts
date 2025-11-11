import { useState, useEffect, useCallback } from 'react';
import type { Process, SchedulingAlgorithm, SimulationResult } from '../types';

export interface SimulationHistoryEntry {
  id: string;
  timestamp: number;
  simulationType: 'cpu-scheduling' | 'memory-management' | 'page-replacement' | 'disk-scheduling';
  algorithm: string;
  processes: Process[];
  result: SimulationResult;
  timeQuantum?: number;
  name?: string;
}

const STORAGE_KEY = 'os_vlab_simulation_history';
const MAX_HISTORY_ITEMS = 50;

export const useSimulationHistory = () => {
  const [history, setHistory] = useState<SimulationHistoryEntry[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
      }
    } catch (error) {
      console.error('Error loading simulation history:', error);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving simulation history:', error);
    }
  }, [history]);

  /**
   * Add a new simulation to history
   */
  const addToHistory = useCallback((entry: Omit<SimulationHistoryEntry, 'id' | 'timestamp'>) => {
    const newEntry: SimulationHistoryEntry = {
      ...entry,
      id: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    setHistory(prev => {
      const updated = [newEntry, ...prev];
      // Keep only the most recent MAX_HISTORY_ITEMS
      return updated.slice(0, MAX_HISTORY_ITEMS);
    });

    return newEntry.id;
  }, []);

  /**
   * Remove a simulation from history
   */
  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => prev.filter(entry => entry.id !== id));
  }, []);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  /**
   * Get simulation by ID
   */
  const getSimulation = useCallback((id: string) => {
    return history.find(entry => entry.id === id);
  }, [history]);

  /**
   * Update simulation name
   */
  const updateSimulationName = useCallback((id: string, name: string) => {
    setHistory(prev => 
      prev.map(entry => 
        entry.id === id ? { ...entry, name } : entry
      )
    );
  }, []);

  /**
   * Get filtered history by simulation type
   */
  const getHistoryByType = useCallback((type: SimulationHistoryEntry['simulationType']) => {
    return history.filter(entry => entry.simulationType === type);
  }, [history]);

  /**
   * Get recent simulations (last N)
   */
  const getRecentSimulations = useCallback((count: number = 5) => {
    return history.slice(0, count);
  }, [history]);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getSimulation,
    updateSimulationName,
    getHistoryByType,
    getRecentSimulations
  };
};
