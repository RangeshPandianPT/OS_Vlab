import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  saveQuizProgress as supabaseSaveQuizProgress,
  getQuizProgress,
  getUserQuizProgress,
  type QuizProgress,
} from '../utils/supabaseStore';

export interface ModuleProgress {
  completed: boolean;
  score: number;
  totalAttempts: number;
  lastAttemptDate?: string;
}

export interface QuizProgressRecord {
  [moduleId: string]: ModuleProgress;
}

export function useQuizProgress() {
  const { currentUser } = useAuth();
  const [progress, setProgress] = useState<QuizProgressRecord>(() => {
    try {
      const stored = localStorage.getItem('os_vlab_quiz_progress');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to parse quiz progress from local storage', error);
      return {};
    }
  });

  const [remoteProgress, setRemoteProgress] = useState<QuizProgress[]>([]);
  const [loading, setLoading] = useState(false);

  // Load from Supabase if user is logged in
  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      getUserQuizProgress(currentUser)
        .then((progress) => {
          setRemoteProgress(progress);
        })
        .catch((error) => {
          console.warn('Failed to load quiz progress from Database', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [currentUser]);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('os_vlab_quiz_progress', JSON.stringify(progress));
    } catch (error) {
      console.warn('Failed to save quiz progress to local storage', error);
    }
  }, [progress]);

  const markCompleted = useCallback((moduleId: string, score: number) => {
    setProgress((prev) => {
      const existing = prev[moduleId] || { completed: false, score: 0, totalAttempts: 0 };
      
      // Only keep the highest score
      const highestScore = Math.max(existing.score, score);
      
      return {
        ...prev,
        [moduleId]: {
          completed: true,
          score: highestScore,
          totalAttempts: existing.totalAttempts + 1,
          lastAttemptDate: new Date().toISOString()
        }
      };
    });

    // Also save to Supabase if user is logged in
    if (currentUser) {
      const existing = progress[moduleId] || { completed: false, score: 0, totalAttempts: 0 };
      const highestScore = Math.max(existing.score, score);
      
      supabaseSaveQuizProgress(currentUser, moduleId, highestScore, 100, {
        timestamp: new Date().toISOString(),
      }).catch((error) => {
        console.warn('Failed to save quiz progress to Database', error);
      });
    }
  }, [currentUser, progress]);

  const isCompleted = useCallback((moduleId: string): boolean => {
    return progress[moduleId]?.completed || false;
  }, [progress]);

  const getScore = useCallback((moduleId: string): number | null => {
    return progress[moduleId] ? progress[moduleId].score : null;
  }, [progress]);

  const clearProgress = useCallback(() => {
    setProgress({});
    try {
      localStorage.removeItem('os_vlab_quiz_progress');
    } catch (error) {
      console.warn('Failed to clear quiz progress from local storage', error);
    }
  }, []);

  return {
    progress,
    remoteProgress,
    markCompleted,
    isCompleted,
    getScore,
    clearProgress,
    loading
  };
}
