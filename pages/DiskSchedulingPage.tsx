
import React from 'react';
import Card from '../components/Card';

const DiskSchedulingPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Disk Scheduling</h1>
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Disk Head Movement</h2>
        <div className="h-96 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark">
          <p className="text-text-muted-light dark:text-text-muted-dark">
            [Disk Track & Head Movement Visualization Placeholder: FCFS, SSTF, SCAN]
          </p>
        </div>
      </Card>
    </div>
  );
};

export default DiskSchedulingPage;
