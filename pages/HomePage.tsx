import React from 'react';
import { motion } from 'framer-motion';
import type { Page } from '../types';
import Card from '../components/Card';
import { MODULES, OTHER_MODULES } from '../constants';

interface HomePageProps {
  setPage: (page: Page) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const HomePage: React.FC<HomePageProps> = ({ setPage }) => {
  return (
    <div className="space-y-24 relative z-10">
      <section className="text-center py-20 px-4 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/20 dark:bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent dark:text-neon-cyan text-sm font-semibold tracking-wide uppercase mb-6 inline-block">
            Next-Gen Interactive Learning
          </span>
          <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight mb-6 leading-tight">
            Operating System <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-neon-cyan to-neon-blue animate-pulse">
              Virtual Laboratory
            </span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-text-muted-light dark:text-text-muted-dark font-medium">
            Visualize, interact, and understand complex OS concepts. An immersive playground built for students and educators.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPage('cpu-scheduling')}
            className="mt-10 px-10 py-4 bg-gradient-to-r from-accent to-neon-blue text-white font-bold rounded-2xl shadow-xl shadow-accent/20 hover:shadow-accent/40 transition-all text-lg border border-white/10"
          >
            Start Simulation
          </motion.button>
        </motion.div>
      </section>

      <section className="container mx-auto px-4">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-display font-bold mb-10 text-center text-text-light dark:text-text-dark"
        >
          Core Concepts
        </motion.h2>
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {MODULES.map((module) => (
            <motion.div key={module.id} variants={itemVariants}>
              <Card onClick={() => setPage(module.id)} className="h-full">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-accent/10 dark:bg-accent/20 rounded-xl border border-accent/20">
                      <module.icon className="h-7 w-7 text-accent dark:text-neon-cyan" />
                    </div>
                    <h3 className="text-xl font-display font-bold">{module.name}</h3>
                  </div>
                  <p className="mt-5 text-text-muted-light dark:text-text-muted-dark leading-relaxed flex-grow">
                    {module.description}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-display font-bold mb-10 text-center text-text-light dark:text-text-dark"
        >
          Tools & Analysis
        </motion.h2>
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {OTHER_MODULES.map((module) => (
            <motion.div key={module.id} variants={itemVariants}>
              <Card onClick={() => setPage(module.id)} className="h-full">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-accent/10 dark:bg-accent/20 rounded-xl border border-accent/20">
                      <module.icon className="h-7 w-7 text-accent dark:text-neon-cyan" />
                    </div>
                    <h3 className="text-xl font-display font-bold">{module.name}</h3>
                  </div>
                  <p className="mt-5 text-text-muted-light dark:text-text-muted-dark leading-relaxed flex-grow">
                    {module.description}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
};

export default HomePage;
