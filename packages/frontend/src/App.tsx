import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import HomePage from './pages/HomePage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import NotFoundPage from './pages/NotFoundPage.tsx';
import ThemeToggle from './components/ThemeToggle.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';

function AppShell() {
  const { user, logout, loading } = useAuth();

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-semibold">Expense Tracker</h1>
        <div className="flex items-center gap-4">
          {!loading && user && (
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Sign out
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>
      <main className="px-6 py-8">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
