import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="text-center py-20">
      <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-dark-text">404</h2>
      <p className="text-gray-500 dark:text-dark-text-secondary mb-6">Page not found.</p>
      <Link
        to="/"
        className="text-emerald-600 dark:text-emerald-400 underline hover:no-underline font-medium"
      >
        Go home
      </Link>
    </div>
  );
}
