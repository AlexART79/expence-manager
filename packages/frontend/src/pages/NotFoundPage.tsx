import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="text-center py-20">
      <h2 className="text-3xl font-bold mb-4">404</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Page not found.</p>
      <Link
        to="/"
        className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
      >
        Go home
      </Link>
    </div>
  );
}
