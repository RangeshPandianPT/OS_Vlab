import React, { useState } from 'react';
import Modal from './Modal';
import { useSavedSimulations } from '../hooks/useSimulationSaver';
import { useAuth } from '../hooks/useAuth';
import { AlertCircle, Save } from 'lucide-react';

interface SaveSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  algorithmType: string;
  simulationState: Record<string, unknown>;
  defaultName?: string;
  ganttChartData?: Record<string, unknown>;
  results?: Record<string, unknown>;
}

const SaveSimulationModal: React.FC<SaveSimulationModalProps> = ({
  isOpen,
  onClose,
  algorithmType,
  simulationState,
  defaultName = '',
  ganttChartData,
  results,
}) => {
  const { currentUser } = useAuth();
  const { saveSimulation, error: saveError } = useSavedSimulations();
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!name.trim()) {
      setError('Please enter a name for the simulation');
      return;
    }

    if (!currentUser) {
      setError('You must be logged in to save simulations');
      return;
    }

    setLoading(true);

    try {
      const tagArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      await saveSimulation(
        algorithmType,
        name,
        simulationState,
        description || undefined,
        ganttChartData,
        results,
        tagArray
      );

      setSuccess(true);
      setName(defaultName);
      setDescription('');
      setTags('');

      // Close modal after 1.5 seconds to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage || saveError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save Simulation">
      {!currentUser ? (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
          <p className="text-sm text-amber-600">
            You must be logged in to save simulations.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <Save className="text-green-600 flex-shrink-0" size={20} />
              <p className="text-sm text-green-600">Simulation saved successfully!</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Simulation Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., FCFS vs RR Comparison"
              className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-transparent focus:ring-2 focus:ring-accent focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes about this simulation..."
              rows={3}
              className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-transparent focus:ring-2 focus:ring-accent focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., important, comparison, testing"
              className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-transparent focus:ring-2 focus:ring-accent focus:outline-none"
            />
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm">
            <p className="font-medium mb-2">This simulation will include:</p>
            <ul className="space-y-1 text-text-muted-light dark:text-text-muted-dark">
              <li>✓ Simulation state and parameters</li>
              {ganttChartData && <li>✓ Gantt chart data</li>}
              {results && <li>✓ Results and statistics</li>}
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover disabled:bg-accent/50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Simulation
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default SaveSimulationModal;
