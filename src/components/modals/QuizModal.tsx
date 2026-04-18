import React, { useState } from 'react';
import Modal from '@/components/modals/Modal';
import { Button } from '@/components/ui/Button';
import { QUIZ_RECORD } from '@/data/quizData';
import { useQuizProgress } from '@/hooks/useQuizProgress';
import { CheckCircle, XCircle, ChevronRight, Award } from 'lucide-react';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
}

const QuizModal: React.FC<QuizModalProps> = ({ isOpen, onClose, moduleId }) => {
  const quiz = QUIZ_RECORD[moduleId];
  const { markCompleted, getScore } = useQuizProgress();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected]     = useState<string | null>(null);
  const [answers, setAnswers]        = useState<Record<string, string>>({});
  const [submitted, setSubmitted]    = useState(false);
  const [finished, setFinished]      = useState(false);
  const [score, setScore]            = useState(0);

  const reset = () => {
    setCurrentIdx(0);
    setSelected(null);
    setAnswers({});
    setSubmitted(false);
    setFinished(false);
    setScore(0);
  };

  const handleClose = () => { reset(); onClose(); };

  if (!quiz) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Quiz" maxWidth="max-w-lg">
        <p className="text-sm text-text-muted">No quiz available for this module yet.</p>
      </Modal>
    );
  }

  const question = quiz.questions[currentIdx];
  const totalQ = quiz.questions.length;

  const handleSubmit = () => {
    if (!selected) return;
    setAnswers(prev => ({ ...prev, [question.id]: selected }));
    setSubmitted(true);
  };

  const handleNext = () => {
    if (currentIdx + 1 < totalQ) {
      setCurrentIdx(i => i + 1);
      setSelected(null);
      setSubmitted(false);
    } else {
      // Calculate score
      const correct = quiz.questions.filter(q => {
        const ans = q.id === question.id ? selected : answers[q.id];
        return ans === q.correctAnswer;
      }).length;
      const pct = Math.round((correct / totalQ) * 100);
      setScore(pct);
      markCompleted(moduleId, pct);
      setFinished(true);
    }
  };

  const isCorrect = submitted && selected === question.correctAnswer;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`${quiz.title} Quiz`} maxWidth="max-w-xl">
      {finished ? (
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 shadow-recessed">
            <Award size={40} className="text-accent" />
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold text-text-primary">{score}%</p>
            <p className="text-sm text-text-muted mt-1">
              {score >= 80 ? 'Excellent work!' : score >= 50 ? 'Good effort!' : 'Keep practicing!'}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={reset}>Try Again</Button>
            <Button variant="primary" size="sm" onClick={handleClose}>Done</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-muted shadow-recessed overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{ width: `${((currentIdx + 1) / totalQ) * 100}%` }}
              />
            </div>
            <span className="text-xs font-mono text-text-muted">{currentIdx + 1}/{totalQ}</span>
          </div>

          {/* Question */}
          <p className="text-sm font-medium text-text-primary leading-relaxed">{question.question}</p>

          {/* Options */}
          <div className="flex flex-col gap-2">
            {question.type === 'true-false' ? (
              ['True', 'False'].map(opt => (
                <OptionButton
                  key={opt}
                  label={opt}
                  selected={selected === opt}
                  submitted={submitted}
                  isCorrect={opt === question.correctAnswer}
                  onClick={() => !submitted && setSelected(opt)}
                />
              ))
            ) : (
              question.options?.map(opt => (
                <OptionButton
                  key={opt}
                  label={opt}
                  selected={selected === opt}
                  submitted={submitted}
                  isCorrect={opt === question.correctAnswer}
                  onClick={() => !submitted && setSelected(opt)}
                />
              ))
            )}
          </div>

          {/* Explanation */}
          {submitted && (
            <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-xs ${
              isCorrect
                ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400'
                : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
            }`}>
              {isCorrect
                ? <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                : <XCircle    size={16} className="flex-shrink-0 mt-0.5" />
              }
              <span>{question.explanation}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            {!submitted ? (
              <Button variant="primary" size="sm" onClick={handleSubmit} disabled={!selected}>
                Submit
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={handleNext}>
                {currentIdx + 1 < totalQ ? (
                  <><ChevronRight size={14} className="mr-1" />Next</>
                ) : (
                  'See Results'
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

interface OptionButtonProps {
  label: string;
  selected: boolean;
  submitted: boolean;
  isCorrect: boolean;
  onClick: () => void;
}

const OptionButton: React.FC<OptionButtonProps> = ({
  label, selected, submitted, isCorrect, onClick
}) => {
  let cls = 'w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-150 ';
  if (!submitted) {
    cls += selected
      ? 'bg-accent/10 border-accent text-accent font-medium'
      : 'bg-background shadow-recessed border-transparent hover:border-accent/40 text-text-primary';
  } else if (isCorrect) {
    cls += 'bg-green-500/10 border-green-500 text-green-600 dark:text-green-400 font-medium';
  } else if (selected && !isCorrect) {
    cls += 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400';
  } else {
    cls += 'bg-background border-transparent text-text-muted opacity-60';
  }

  return (
    <button className={cls} onClick={onClick} disabled={submitted}>
      {label}
    </button>
  );
};

export default QuizModal;
