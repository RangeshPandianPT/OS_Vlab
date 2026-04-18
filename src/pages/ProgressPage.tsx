import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { getUserQuizProgress, loadUserSimulations } from '@/utils/supabaseStore';
import type { QuizProgress, SavedSimulation } from '@/utils/supabaseStore';
import { Award, BookOpen, Save, TrendingUp, CheckCircle, XCircle, Lock } from 'lucide-react';
import { MODULES } from '@/constants';

const QUIZ_TOPICS = MODULES.map(m => m.id);

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const ProgressPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [quizProgress, setQuizProgress] = useState<QuizProgress[]>([]);
  const [simulations, setSimulations] = useState<SavedSimulation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    Promise.all([
      getUserQuizProgress(currentUser).catch(() => []),
      loadUserSimulations(currentUser).catch(() => []),
    ]).then(([quiz, sims]) => {
      setQuizProgress(quiz);
      setSimulations(sims);
      setLoading(false);
    });
  }, [currentUser]);

  const totalQuizzesTaken = quizProgress.length;
  const avgScore = totalQuizzesTaken > 0
    ? Math.round(quizProgress.reduce((acc, q) => acc + (q.score / q.maxScore) * 100, 0) / totalQuizzesTaken)
    : 0;
  const totalSims = simulations.length;
  const topicsAttempted = new Set(quizProgress.map(q => q.topic)).size;

  // Best score per topic
  const bestByTopic = quizProgress.reduce<Record<string, QuizProgress>>((acc, q) => {
    const prev = acc[q.topic];
    if (!prev || q.score > prev.score) acc[q.topic] = q;
    return acc;
  }, {});

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-background shadow-card">
          <Lock size={32} className="text-text-muted" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Sign In to Track Progress</h2>
          <p className="text-text-muted max-w-xs">
            Your quiz results and saved simulations are stored securely when you're signed in.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4 text-text-muted">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent text-accent" />
          <p className="text-sm font-mono font-bold tracking-tight uppercase">Loading progress…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary drop-shadow-[0_1px_1px_#ffffff]">
          My Progress
        </h1>
        <p className="text-text-muted mt-1 text-sm">
          Track your quiz scores and saved simulations across all modules.
        </p>
      </div>

      {/* Stats row */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {[
          { label: 'Quiz Attempts', value: totalQuizzesTaken, icon: BookOpen, color: 'text-blue-500' },
          { label: 'Avg Score', value: `${avgScore}%`, icon: TrendingUp, color: 'text-green-500' },
          { label: 'Topics Attempted', value: topicsAttempted, icon: Award, color: 'text-yellow-500' },
          { label: 'Saved Simulations', value: totalSims, icon: Save, color: 'text-accent' },
        ].map(stat => (
          <motion.div key={stat.label} variants={itemVariants as any}>
            <Card hideDetails className="text-center">
              <stat.icon size={24} className={`mx-auto mb-3 ${stat.color}`} />
              <p className="text-3xl font-extrabold font-mono text-text-primary">{stat.value}</p>
              <p className="text-xs font-mono font-bold uppercase tracking-wide text-text-muted mt-1">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Quiz results per topic */}
      <section>
        <h2 className="text-lg font-bold font-mono uppercase tracking-wide text-text-muted mb-4">
          Quiz Results by Topic
        </h2>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {MODULES.map(module => {
            const best = bestByTopic[module.id];
            const pct = best ? Math.round((best.score / best.maxScore) * 100) : null;
            const attempts = quizProgress.filter(q => q.topic === module.id).length;

            return (
              <motion.div key={module.id} variants={itemVariants as any}>
                <Card hideDetails className={best ? '' : 'opacity-60'}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background shadow-card flex-shrink-0">
                      <module.icon size={16} className="text-accent" />
                    </div>
                    <span className="text-sm font-bold text-text-primary leading-tight">{module.name}</span>
                  </div>

                  {best ? (
                    <>
                      {/* Score bar */}
                      <div className="h-2 w-full rounded-full bg-muted shadow-recessed overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pct! >= 80 ? 'bg-green-500' : pct! >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-text-muted">{attempts} attempt{attempts !== 1 ? 's' : ''}</span>
                        <div className="flex items-center gap-1">
                          {pct! >= 50
                            ? <CheckCircle size={13} className="text-green-500" />
                            : <XCircle size={13} className="text-red-500" />
                          }
                          <span className="text-sm font-bold font-mono text-text-primary">{pct}%</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-text-muted font-mono">Not attempted yet</p>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Recent simulations */}
      {simulations.length > 0 && (
        <section>
          <h2 className="text-lg font-bold font-mono uppercase tracking-wide text-text-muted mb-4">
            Recent Saved Simulations
          </h2>
          <motion.div
            className="flex flex-col gap-3"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {simulations.slice(0, 8).map(sim => (
              <motion.div key={sim.id} variants={itemVariants as any}>
                <Card hideDetails>
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text-primary truncate">{sim.name}</p>
                      <p className="text-xs text-text-muted font-mono mt-0.5">
                        {sim.algorithmType} · {new Date(sim.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="flex-shrink-0 px-2.5 py-1 rounded-md bg-background shadow-recessed text-[11px] font-mono font-bold uppercase tracking-wide text-text-muted">
                      {sim.algorithmType}
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {totalQuizzesTaken === 0 && totalSims === 0 && (
        <Card hideDetails className="text-center py-12">
          <TrendingUp size={40} className="mx-auto mb-4 text-text-muted opacity-40" />
          <p className="text-text-muted text-sm">
            No activity yet. Start a simulation or take a quiz to see your progress here.
          </p>
        </Card>
      )}
    </div>
  );
};

export default ProgressPage;
