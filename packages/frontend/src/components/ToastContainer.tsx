import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useWebSocket, type BudgetAlert } from '../context/WebSocketContext.tsx';

function Toast({
  alert,
  dismissAlert,
}: {
  alert: BudgetAlert;
  dismissAlert: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => dismissAlert(alert.id), 6000);
    return () => clearTimeout(timer);
  }, [alert.id, dismissAlert]);

  const accentColor =
    alert.threshold >= 100
      ? 'border-red-500'
      : alert.threshold >= 80
        ? 'border-amber-500'
        : 'border-blue-500';

  const title =
    alert.threshold >= 100 ? 'Budget Exceeded' : `${alert.threshold}% Budget Used`;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 w-80 rounded-lg border border-gray-200 border-l-4 ${accentColor} bg-white dark:bg-dark-surface dark:border-dark-border shadow-lg p-4`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-dark-text">{title}</p>
        <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-0.5">
          {alert.usagePercent.toFixed(1)}% of your budget spent this month.
        </p>
      </div>
      <button
        onClick={() => dismissAlert(alert.id)}
        aria-label="Dismiss alert"
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-dark-text-secondary transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { alerts, dismissAlert } = useWebSocket();

  if (alerts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {alerts.map((alert) => (
        <Toast key={alert.id} alert={alert} dismissAlert={dismissAlert} />
      ))}
    </div>
  );
}
