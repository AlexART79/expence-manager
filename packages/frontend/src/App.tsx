import { Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import HomePage from './pages/HomePage.tsx';
import NotFoundPage from './pages/NotFoundPage.tsx';
import ThemeToggle from './components/ThemeToggle.tsx';

export default function App() {
  const [loading, setLoading] = useState(true);

  // Simulate initial bootstrap — replaced with real session fetch in Stage 1
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-semibold">Expense Tracker</h1>
        <ThemeToggle />
      </header>
      <main className="px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <span className="text-gray-400 dark:text-gray-600">Loading...</span>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        )}
      </main>
    </div>
  );
}
