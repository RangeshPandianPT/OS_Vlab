
import React from 'react';
import Card from '../components/Card';

const ProgressPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Progress</h1>
      <Card className="p-6">
        <p className="text-text-muted-light dark:text-text-muted-dark">
          This page will track user progress through various topics and simulations.
        </p>
      </Card>
    </div>
  );
};

export default ProgressPage;