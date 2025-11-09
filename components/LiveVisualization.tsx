// FIX: Create the LiveVisualization component to resolve the "not a module" error.
import React from 'react';
import Card from './Card';

const LiveVisualization: React.FC = () => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Live Visualization</h2>
      <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark">
        <p className="text-text-muted-light dark:text-text-muted-dark">
          [Live visualization of ready queue and CPU will be shown here during simulation]
        </p>
      </div>
    </Card>
  );
};

export default LiveVisualization;
