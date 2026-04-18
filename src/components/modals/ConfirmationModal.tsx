import React from 'react';
import Modal from '@/components/modals/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: 'primary' | 'secondary';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmVariant = 'primary',
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent/10">
          <AlertTriangle size={20} className="text-accent" />
        </div>
        <p className="text-sm text-text-muted leading-relaxed pt-1">{message}</p>
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button variant={confirmVariant} size="sm" onClick={onConfirm}>
          {confirmText}
        </Button>
      </div>
    </div>
  </Modal>
);

export default ConfirmationModal;
