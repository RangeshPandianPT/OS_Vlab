import { useState, useEffect } from 'react';

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
  const [progress, setProgress] = useState<QuizProgressRecord>(() => {
    try {
      const stored = localStorage.getItem('os_vlab_quiz_progress');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to parse quiz progress from local storage', error);
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('os_vlab_quiz_progress', JSON.stringify(progress));
    } catch (error) {
      console.warn('Failed to save quiz progress to local storage', error);
    }
  }, [progress]);

  const markCompleted = (moduleId: string, score: number) => {
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
  };

  const isCompleted = (moduleId: string): boolean => {
    return progress[moduleId]?.completed || false;
  };

  const getScore = (moduleId: string): number | null => {
    return progress[moduleId] ? progress[moduleId].score : null;
  };

  const clearProgress = () => {
    setProgress({});
  };

  return {
    progress,
    markCompleted,
    isCompleted,
    getScore,
    clearProgress
  };
}
