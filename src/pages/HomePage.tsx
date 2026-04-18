import React from 'react';
import { motion } from 'framer-motion';
import type { Page } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MODULES, OTHER_MODULES } from '@/constants';

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
    <div className="space-y-24 relative z-10 w-full mb-16">
      <section className="text-center py-20 px-4 relative max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.175, 0.885, 0.32, 1.275] }}
        >
          <span className="px-4 py-1.5 rounded-sm border border-border-dark bg-background shadow-recessed text-text-muted text-xs font-bold tracking-widest font-mono uppercase mb-8 inline-block">
            Next-Gen Interactive Learning
          </span>
          <h1 className="text-5xl md:text-7xl font-sans font-extrabold tracking-tight mb-8 leading-tight text-text-primary drop-shadow-[0_1px_1px_#ffffff]">
            Operating System <br/>
            <span className="text-accent underline decoration-4 underline-offset-4 decoration-accent/30">
              Virtual Laboratory
            </span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-text-muted leading-relaxed font-medium drop-shadow-[0_1px_0_#ffffff]">
            Visualize, interact, and understand complex OS concepts. An immersive playground engineered for students and educators.
          </p>
          <div className="mt-12 group flex justify-center">
            <Button
              size="lg"
              variant="primary"
              onClick={() => setPage('cpu-scheduling')}
              style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
            >
              Start Simulation
            </Button>
          </div>
        </motion.div>
      </section>

      <section className="container mx-auto px-4 md:px-8">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-sans font-bold mb-12 text-center text-text-primary drop-shadow-[0_1px_1px_#ffffff]"
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
            <motion.div key={module.id} variants={itemVariants as any} className="h-full">
              <Card onClick={() => setPage(module.id)} className="h-full cursor-pointer group">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-5 mb-6">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-background shadow-floating border border-white/60 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
                      <module.icon className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="text-xl font-sans font-bold text-text-primary">{module.name}</h3>
                  </div>
                  <p className="text-text-muted text-sm md:text-base leading-relaxed flex-grow">
                    {module.description}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="container mx-auto px-4 md:px-8 pb-12">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-sans font-bold mb-12 text-center text-text-primary drop-shadow-[0_1px_1px_#ffffff]"
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
            <motion.div key={module.id} variants={itemVariants as any} className="h-full">
              <Card onClick={() => setPage(module.id)} className="h-full cursor-pointer group">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-5 mb-6">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-background shadow-floating border border-white/60 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
                      <module.icon className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="text-xl font-sans font-bold text-text-primary">{module.name}</h3>
                  </div>
                  <p className="text-text-muted text-sm md:text-base leading-relaxed flex-grow">
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
