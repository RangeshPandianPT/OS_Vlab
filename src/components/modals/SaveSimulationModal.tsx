import React, { useState } from 'react';
import Modal from '@/components/modals/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useSavedSimulations } from '@/hooks/useSimulationSaver';
import { useAuth } from '@/hooks/useAuth';
import { Save } from 'lucide-react';

interface SaveSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  algorithmType: string;
  simulationState: Record<string, unknown>;
  defaultName?: string;
  ganttChartData?: Record<string, unknown> | any[] | null;
  results?: Record<string, unknown> | null;
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
  const { saveSimulation } = useSavedSimulations(false);
  const [name, setName]           = useState(defaultName);
  const [description, setDesc]    = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { setError('Please enter a name.'); return; }
    setError('');
    setLoading(true);
    try {
      await saveSimulation(
        algorithmType,
        name.trim(),
        simulationState,
        description || undefined,
        Array.isArray(ganttChartData) ? { entries: ganttChartData } : ganttChartData ?? undefined,
        results ?? undefined,
      );
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Save Simulation" maxWidth="max-w-sm">
        <p className="text-sm text-text-muted text-center py-4">
          You need to be signed in to save simulations.
        </p>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save Simulation" maxWidth="max-w-sm">
      <div className="flex flex-col gap-4">
        {success ? (
          <p className="text-sm text-green-500 text-center py-4">Simulation saved!</p>
        ) : (
          <>
            {error && (
              <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold font-mono uppercase tracking-wide text-text-muted">Name</label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="My simulation"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold font-mono uppercase tracking-wide text-text-muted">Description (optional)</label>
              <textarea
                value={description}
                onChange={e => setDesc(e.target.value)}
                placeholder="Notes about this simulation…"
                rows={3}
                className="bg-background shadow-recessed border-none rounded-lg px-4 py-3 font-mono text-sm text-text-primary placeholder:text-text-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleSave} disabled={loading}>
                <Save size={14} className="mr-1.5" />
                {loading ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default SaveSimulationModal;
