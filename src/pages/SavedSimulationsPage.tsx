
import React, { useState } from 'react';
import Card from '@/components/shared/Card';
import { useAuth } from '@/hooks/useAuth';
import { useSavedSimulations } from '@/hooks/useSimulationSaver';
import { Trash2, ExternalLink, RefreshCw, Filter } from 'lucide-react';
import Modal from '@/components/modals/Modal';
import type { SavedSimulation } from '@/utils/supabaseStore';

const SavedSimulationsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { simulations, loading, error, deleteSimulation, refreshSimulations } = useSavedSimulations(true);
  const [selectedSimulation, setSelectedSimulation] = useState<SavedSimulation | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handleDelete = async (simulationId: string) => {
    if (confirm('Are you sure you want to delete this simulation?')) {
      try {
        await deleteSimulation(simulationId);
      } catch (err) {
        console.error('Error deleting simulation:', err);
      }
    }
  };

  const handleLoadSimulation = (simulation: SavedSimulation) => {
    setSelectedSimulation(simulation);
    setIsDetailsModalOpen(true);
    // In a real app, you would navigate to the simulation page with the loaded state
    console.log('Loading simulation:', simulation);
  };

  const algorithmTypes = [
    { value: 'all', label: 'All Simulations' },
    { value: 'cpu-scheduling', label: 'CPU Scheduling' },
    { value: 'memory-management', label: 'Memory Management' },
    { value: 'page-replacement', label: 'Page Replacement' },
    { value: 'disk-scheduling', label: 'Disk Scheduling' },
    { value: 'process-management', label: 'Process Management' },
    { value: 'threads-sync', label: 'Threads & Synchronization' },
    { value: 'deadlock', label: 'Deadlock' },
  ];

  const filteredSimulations = filterType === 'all'
    ? simulations
    : simulations.filter(sim => sim.algorithmType === filterType);

  if (!currentUser) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Saved Simulations</h1>
        <Card className="p-6">
          <div className="border border-dashed border-accent rounded-lg p-12 text-center">
            <h3 className="text-lg font-semibold text-accent mb-2">Login Required</h3>
            <p className="text-text-muted">
              You need to be logged in to view and manage your saved simulations.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <h1 className="text-3xl font-bold">Saved Simulations</h1>
        <button
          onClick={() => refreshSimulations()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <Card className="p-4 bg-red-500/10 border border-red-500/30">
          <p className="text-red-500 text-sm">{error}</p>
        </Card>
      )}

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Filter size={20} />
          <label className="text-sm font-medium">Filter by Type:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-white/40 dark:border-white/10 rounded-lg bg-background focus:ring-2 focus:ring-accent focus:outline-none"
          >
            {algorithmTypes.map(type => (
              <option key={type.value} value={type.value} className="bg-panel">
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-accent border-t-transparent"></div>
            <span className="ml-3 text-text-muted">Loading simulations...</span>
          </div>
        ) : filteredSimulations.length === 0 ? (
          <div className="border border-dashed border-white/40 dark:border-white/10 rounded-lg p-12 text-center">
            <p className="text-text-muted">
              {filterType === 'all' 
                ? 'You have no saved simulations yet. Start a simulation and save your results!'
                : 'No simulations found for this type.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSimulations.map((simulation) => (
              <Card key={simulation.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg truncate">{simulation.name}</h3>
                    <p className="text-xs text-text-muted">
                      {algorithmTypes.find(t => t.value === simulation.algorithmType)?.label || simulation.algorithmType}
                    </p>
                  </div>

                  {simulation.description && (
                    <p className="text-sm text-text-muted line-clamp-2">
                      {simulation.description}
                    </p>
                  )}

                  <div className="text-xs text-text-muted space-y-1">
                    <p>Created: {new Date(simulation.createdAt).toLocaleDateString()}</p>
                    <p>Updated: {new Date(simulation.updatedAt).toLocaleDateString()}</p>
                  </div>

                  {simulation.tags && simulation.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {simulation.tags.map((tag) => (
                        <span key={tag} className="px-2 py-1 text-xs bg-accent/20 text-accent rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleLoadSimulation(simulation)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                    >
                      <ExternalLink size={14} />
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(simulation.id)}
                      className="px-3 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {selectedSimulation && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Simulation: ${selectedSimulation.name}`}
        >
          <div className="space-y-4">
            {selectedSimulation.description && (
              <div>
                <h4 className="font-semibold mb-1">Description</h4>
                <p className="text-sm text-text-muted">
                  {selectedSimulation.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm mb-1">Algorithm Type</h4>
                <p className="text-sm text-text-muted">
                  {algorithmTypes.find(t => t.value === selectedSimulation.algorithmType)?.label}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Created</h4>
                <p className="text-sm text-text-muted">
                  {new Date(selectedSimulation.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {selectedSimulation.results && (
              <div>
                <h4 className="font-semibold mb-1">Results Summary</h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48">
                  {JSON.stringify(selectedSimulation.results, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => {
                  alert('Loading simulation state... (Feature to be implemented)');
                }}
                className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              >
                Load Simulation
              </button>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="flex-1 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SavedSimulationsPage;
