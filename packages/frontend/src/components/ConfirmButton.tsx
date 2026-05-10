import { useState, useEffect } from 'react';
import type { ComponentType } from 'react';

interface ConfirmButtonProps {
  icon: ComponentType<{ size: number }>;
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
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onConfirm();
      setIsConfirming(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsConfirming(false);
    setError(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isConfirming) {
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isConfirming]);

  if (isConfirming) {
    return (
      <div className="flex items-center gap-2 flex-col">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 dark:text-dark-text-secondary">
            {confirmMessage}
          </span>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            aria-label="Cancel"
            className="px-2 py-1 rounded text-xs border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-raised disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            aria-label={confirmText}
            className={`px-2 py-1 rounded text-xs font-medium text-white transition-colors disabled:opacity-50 ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700'
                : 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700'
            }`}
          >
            {isLoading ? 'Loading...' : confirmText}
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsConfirming(true)}
      aria-label={iconLabel}
      className={`p-2 rounded-lg text-white transition-colors ${
        isDangerous
          ? 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700'
          : 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700'
      } ${className}`}
    >
      <Icon size={16} />
    </button>
  );
}
