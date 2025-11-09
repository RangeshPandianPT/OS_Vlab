
import React from 'react';
import type { Page } from '../types';
import Card from '../components/Card';
import { MODULES, OTHER_MODULES } from '../constants';

interface HomePageProps {
  setPage: (page: Page) => void;
}

const HomePage: React.FC<HomePageProps> = ({ setPage }) => {
  return (
    <div className="space-y-16">
      <section className="text-center py-16">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400">
          Operating System Virtual Laboratory
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-text-muted-light dark:text-text-muted-dark">
          Visualize, interact, and understand complex OS concepts. An interactive playground for students and educators.
        </p>
        <button
            onClick={() => setPage('cpu-scheduling')}
            className="mt-8 px-8 py-3 bg-accent text-white font-semibold rounded-lg shadow-md hover:bg-accent-hover transition-all duration-300 transform hover:scale-105"
        >
          Start Simulation
        </button>
      </section>

      <section>
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Core Concepts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MODULES.map((module) => (
            <Card key={module.id} onClick={() => setPage(module.id)}>
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <module.icon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold">{module.name}</h3>
                </div>
                <p className="mt-4 text-text-muted-light dark:text-text-muted-dark">
                  {module.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Tools & Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {OTHER_MODULES.map((module) => (
            <Card key={module.id} onClick={() => setPage(module.id)}>
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <module.icon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold">{module.name}</h3>
                </div>
                <p className="mt-4 text-text-muted-light dark:text-text-muted-dark">
                  {module.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
