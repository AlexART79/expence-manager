import { Routes, Route, NavLink } from 'react-router-dom';
import { DollarSign, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import HomePage from './pages/HomePage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import NotFoundPage from './pages/NotFoundPage.tsx';
import CategoriesPage from './pages/CategoriesPage.tsx';
import TransactionsPage from './pages/TransactionsPage.tsx';
import ThemeToggle from './components/ThemeToggle.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import { WebSocketProvider } from './context/WebSocketContext.tsx';
import ToastContainer from './components/ToastContainer.tsx';

function AppShell() {
  const { user, logout, loading } = useAuth();

  return (
    <WebSocketProvider>
      <div className="min-h-screen bg-white text-gray-900 dark:bg-dark-base dark:text-dark-text">
        <header className="sticky top-0 z-10 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border">
          <div className="h-[52px] max-w-5xl mx-auto px-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center">
                <DollarSign size={16} className="text-white" />
              </div>
              <h1 className="text-base font-semibold tracking-tight">Expence</h1>
              {!loading && user && (
                <nav className="flex items-center gap-4 text-sm">
                  <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                      isActive
                        ? 'px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-dark-raised text-emerald-600 dark:text-emerald-400 font-medium text-sm'
                        : 'px-3 py-1.5 rounded-lg text-gray-500 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-raised transition-colors text-sm'
                    }
                  >
                    Dashboard
                  </NavLink>
                  <NavLink
                    to="/categories"
                    className={({ isActive }) =>
                      isActive
                        ? 'px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-dark-raised text-emerald-600 dark:text-emerald-400 font-medium text-sm'
                        : 'px-3 py-1.5 rounded-lg text-gray-500 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-raised transition-colors text-sm'
                    }
                  >
                    Categories
                  </NavLink>
                  <NavLink
                    to="/transactions"
                    className={({ isActive }) =>
                      isActive
                        ? 'px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-dark-raised text-emerald-600 dark:text-emerald-400 font-medium text-sm'
                        : 'px-3 py-1.5 rounded-lg text-gray-500 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-raised transition-colors text-sm'
                    }
                  >
                    Transactions
                  </NavLink>
                </nav>
              )}
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              {!loading && user && (
                <button
                  onClick={logout}
                  aria-label="Sign out"
                  className="p-2 rounded-lg text-gray-500 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-raised transition-colors"
                >
                  <LogOut size={18} />
                </button>
              )}
            </div>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-5 py-7">
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories"
              element={
                <ProtectedRoute>
                  <CategoriesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <TransactionsPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <ToastContainer />
      </div>
    </WebSocketProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<AppShell />} />
      </Routes>
    </AuthProvider>
  );
}
