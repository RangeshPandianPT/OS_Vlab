import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-bkg-light dark:bg-bkg-dark rounded-2xl shadow-2xl w-full max-w-md m-4 transition-all duration-300 ease-in-out transform scale-95 opacity-0 animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        style={{ animationFillMode: 'forwards' }}
      >
        <div className="flex justify-between items-center p-6 border-b border-border-light dark:border-border-dark">
          <h2 id="modal-title" className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-full text-text-muted-light dark:text-text-muted-dark hover:bg-gray-200 dark:hover:bg-gray-700">
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
      <style>{`
        @keyframes fade-in-scale {
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Modal;
