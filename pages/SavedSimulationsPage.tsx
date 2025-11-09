
import React from 'react';
import Card from '../components/Card';

const SavedSimulationsPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Saved Simulations</h1>
      <Card className="p-6">
        <p className="text-text-muted-light dark:text-text-muted-dark">
          This is where saved simulations from Firebase Firestore will be listed. Users can load, view, and compare their past results.
        </p>
        <div className="mt-8 border border-dashed border-border-light dark:border-border-dark rounded-lg p-12 text-center">
            <p className="text-text-muted-light dark:text-text-muted-dark">You have no saved simulations yet.</p>
            {/* TODO: Implement Firebase login and data fetching */}
        </div>
      </Card>
    </div>
  );
};

export default SavedSimulationsPage;
