import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import ConfirmModal from './ConfirmModal.tsx';

interface ConfirmButtonProps {
  icon: LucideIcon;
  iconLabel: string;
  onConfirm: () => Promise<void>;
  confirmMessage?: string;
  confirmText?: string;
  isDangerous?: boolean;
  className?: string;
}

export default function ConfirmButton({
  icon: Icon,
  iconLabel,
  onConfirm,
  confirmMessage = 'Are you sure?',
  confirmText = 'Confirm',
  isDangerous = false,
  className = '',
}: ConfirmButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onConfirm();
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setError(null);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label={iconLabel}
        className={`p-2 rounded-lg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-raised transition-colors ${className}`}
      >
        <Icon size={16} />
      </button>
      {isOpen && (
        <ConfirmModal
          message={confirmMessage}
          confirmText={confirmText}
          isDangerous={isDangerous}
          isLoading={isLoading}
          error={error}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
