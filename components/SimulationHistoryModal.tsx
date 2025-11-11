import React, { useState } from 'react';
import Modal from './Modal';
import { useSimulationHistory, SimulationHistoryEntry } from '../hooks/useSimulationHistory';
import { Clock, Trash2, Download, Play, FileText, Edit2, Check, X } from 'lucide-react';

interface SimulationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplay: (entry: SimulationHistoryEntry) => void;
  simulationType?: 'cpu-scheduling' | 'memory-management' | 'page-replacement' | 'disk-scheduling';
}

const SimulationHistoryModal: React.FC<SimulationHistoryModalProps> = ({
  isOpen,
  onClose,
  onReplay,
  simulationType
}) => {
  const { history, removeFromHistory, clearHistory, updateSimulationName, getHistoryByType } = useSimulationHistory();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const displayHistory = simulationType ? getHistoryByType(simulationType) : history;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAlgorithmColor = (algorithm: string) => {
    const colors: Record<string, string> = {
      'FCFS': 'bg-blue-500',
      'SJF': 'bg-cyan-500',
      'SRTF': 'bg-indigo-500',
      'RR': 'bg-purple-500',
      'PRIORITY_NP': 'bg-orange-500',
      'PRIORITY_P': 'bg-red-500',
      'MLQ': 'bg-green-500'
    };
    return colors[algorithm] || 'bg-gray-500';
  };

  const startEditing = (entry: SimulationHistoryEntry) => {
    setEditingId(entry.id);
    setEditName(entry.name || `${entry.algorithm} - ${formatDate(entry.timestamp)}`);
  };

  const saveEdit = (id: string) => {
    updateSimulationName(id, editName);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleReplay = (entry: SimulationHistoryEntry) => {
    onReplay(entry);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Simulation History">
      <div className="space-y-4">
        {/* Header with actions */}
        <div className="flex justify-between items-center pb-3 border-b border-border-light dark:border-border-dark">
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
            {displayHistory.length} simulation{displayHistory.length !== 1 ? 's' : ''} saved
          </p>
          {displayHistory.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all simulation history?')) {
                  clearHistory();
                }
              }}
              className="text-sm px-3 py-1 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1"
            >
              <Trash2 size={14} />
              Clear All
            </button>
          )}
        </div>

        {/* History list */}
        <div className="max-h-[500px] overflow-y-auto space-y-3">
          {displayHistory.length === 0 ? (
            <div className="text-center py-12 text-text-muted-light dark:text-text-muted-dark">
              <FileText size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No simulations saved yet</p>
              <p className="text-xs mt-1">Run a simulation to see it here!</p>
            </div>
          ) : (
            displayHistory.map((entry) => (
              <div
                key={entry.id}
                className="p-4 rounded-lg border border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {editingId === entry.id ? (
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border border-accent rounded-md bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(entry.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                        />
                        <button
                          onClick={() => saveEdit(entry.id)}
                          className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-sm truncate">
                          {entry.name || `${entry.algorithm} - ${formatDate(entry.timestamp)}`}
                        </h3>
                        <button
                          onClick={() => startEditing(entry)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-text-muted-light dark:text-text-muted-dark hover:text-accent transition-opacity"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted-light dark:text-text-muted-dark">
                      <span className={`px-2 py-1 rounded-full text-white ${getAlgorithmColor(entry.algorithm)}`}>
                        {entry.algorithm}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(entry.timestamp)}
                      </span>
                      <span>{entry.processes.length} processes</span>
                      {entry.timeQuantum && <span>TQ: {entry.timeQuantum}</span>}
                    </div>
                    
                    <div className="mt-2 text-xs text-text-muted-light dark:text-text-muted-dark">
                      Avg WT: {entry.result.metrics.averageWaitingTime.toFixed(2)} | 
                      Avg TAT: {entry.result.metrics.averageTurnaroundTime.toFixed(2)} | 
                      CPU: {entry.result.metrics.cpuUtilization.toFixed(1)}%
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => handleReplay(entry)}
                      className="p-2 rounded-md bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                      title="Replay simulation"
                    >
                      <Play size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this simulation?')) {
                          removeFromHistory(entry.id);
                        }
                      }}
                      className="p-2 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Delete simulation"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SimulationHistoryModal;
