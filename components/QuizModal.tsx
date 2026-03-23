import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, BrainCircuit, Loader2, Award, ChevronRight } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { QUIZ_RECORD, QuizQuestion } from '../data/quizData';
import { useQuizProgress } from '../hooks/useQuizProgress';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
}

const QuizModal: React.FC<QuizModalProps> = ({ isOpen, onClose, moduleId }) => {
  const { markCompleted } = useQuizProgress();
  const quizData = QUIZ_RECORD[moduleId];
  
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  useEffect(() => {
    // Reset state when opened with a new module or reopened
    if (isOpen) {
      setCurrentQuestionIdx(0);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setScore(0);
      setShowResults(false);
      setAiExplanation(null);
    }
  }, [isOpen, moduleId]);

  if (!isOpen || !quizData) return null;

  const questions = quizData.questions;
  const currentQuestion: QuizQuestion = questions[currentQuestionIdx];

  const handleSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedAnswer(option);
  };

  const checkAnswer = () => {
    if (!selectedAnswer) return;
    setIsAnswered(true);
    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setAiExplanation(null);
    } else {
      let finalScore = score;
      if (selectedAnswer === currentQuestion.correctAnswer && !isAnswered) {
        finalScore += 1; // edge case if they didn't click check before next
        setScore(finalScore);
      }
      setShowResults(true);
      markCompleted(moduleId, Math.round((finalScore / questions.length) * 100));
    }
  };

  const getGeminiExplanation = async () => {
    const apiKey = localStorage.getItem('GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
      setAiExplanation("Gemini API key not found. Please add it in the AI Tutor settings.");
      return;
    }

    setIsGeneratingAi(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an expert Operating Systems tutor. The student answered this quiz question: "${currentQuestion.question}". The correct answer is "${currentQuestion.correctAnswer}". The student selected "${selectedAnswer}". Explain briefly (2-3 sentences max) why the correct answer is right and clarify the concept.`;
      
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
      });

      setAiExplanation(response.text || "Could not generate an explanation.");
    } catch (error: any) {
      setAiExplanation(`API Error: ${error.message}`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card-light dark:bg-card-dark rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col border border-border-light dark:border-border-dark"
      >
        <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark bg-indigo-50 dark:bg-indigo-900/20">
          <div className="flex items-center gap-2">
            <Award className="text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-text-light dark:text-text-dark">{quizData.title} Quiz</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {showResults ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 mb-6">
                <Award size={48} />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-text-light dark:text-text-dark">Quiz Completed!</h3>
              <p className="text-lg mb-6 text-text-muted-light dark:text-text-muted-dark">
                You scored {score} out of {questions.length} ({(score / questions.length) * 100}%)
              </p>
              <button 
                onClick={onClose}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition"
              >
                Close and return to lab
              </button>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="mb-6 flex justify-between items-center text-sm font-medium text-text-muted-light dark:text-text-muted-dark">
                <span>Question {currentQuestionIdx + 1} of {questions.length}</span>
                <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 px-3 py-1 rounded-full">
                  Score: {score}
                </span>
              </div>
              
              <h3 className="text-xl font-medium mb-6 text-text-light dark:text-text-dark break-words">
                {currentQuestion.question}
              </h3>
              
              <div className="space-y-3 flex-1">
                {currentQuestion.options?.map((opt, i) => {
                  const isSelected = selectedAnswer === opt;
                  const isCorrect = isAnswered && opt === currentQuestion.correctAnswer;
                  const isWrong = isAnswered && isSelected && !isCorrect;
                  const isMissed = isAnswered && !isSelected && opt === currentQuestion.correctAnswer;
                  
                  let borderClass = 'border-border-light dark:border-border-dark hover:border-indigo-400 dark:hover:border-indigo-500';
                  let bgClass = 'bg-transparent';
                  
                  if (isSelected) {
                    borderClass = 'border-indigo-500 ring-1 ring-indigo-500';
                    bgClass = 'bg-indigo-50 dark:bg-indigo-900/20';
                  }

                  if (isCorrect || isMissed) {
                    borderClass = 'border-green-500 ring-1 ring-green-500';
                    bgClass = 'bg-green-50 dark:bg-green-900/20';
                  } else if (isWrong) {
                    borderClass = 'border-red-500 ring-1 ring-red-500';
                    bgClass = 'bg-red-50 dark:bg-red-900/20';
                  }

                  return (
                    <button
                      key={i}
                      disabled={isAnswered}
                      onClick={() => handleSelect(opt)}
                      className={`w-full text-left p-4 rounded-xl border ${borderClass} ${bgClass} transition flex items-center justify-between disabled:cursor-default`}
                    >
                      <span className={`text-text-light dark:text-text-dark font-medium ${isAnswered && !isCorrect && !isWrong && !isMissed ? 'opacity-50' : ''}`}>
                        {opt}
                      </span>
                      {isCorrect || isMissed ? <CheckCircle className="text-green-500" size={20} /> : null}
                      {isWrong ? <XCircle className="text-red-500" size={20} /> : null}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence>
                {isAnswered && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark overflow-hidden"
                  >
                    <h4 className="font-semibold text-text-light dark:text-text-dark mb-2">Explanation</h4>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-4 group-hover:block">
                      {currentQuestion.explanation}
                    </p>
                    
                    {!aiExplanation && (
                      <button 
                        onClick={getGeminiExplanation}
                        disabled={isGeneratingAi}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                      >
                        {isGeneratingAi ? <Loader2 size={14} className="animate-spin" /> : <BrainCircuit size={14} />}
                        Explain deeper with AI Tutor
                      </button>
                    )}
                    
                    {aiExplanation && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/50">
                        <div className="flex items-center gap-1.5 mb-1 text-blue-700 dark:text-blue-300 font-medium text-xs">
                          <BrainCircuit size={14} /> AI Tutor says:
                        </div>
                        <p className="text-sm text-text-light dark:text-text-dark">{aiExplanation}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="mt-6 flex justify-end gap-3">
                {!isAnswered ? (
                  <button
                    onClick={checkAnswer}
                    disabled={!selectedAnswer}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2"
                  >
                    {currentQuestionIdx < questions.length - 1 ? 'Next Question' : 'View Results'}
                    <ChevronRight size={18} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default QuizModal;
