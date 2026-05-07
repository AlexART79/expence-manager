import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getCurrentUser, logout as logoutApi, type CurrentUser } from '../lib/auth.ts';

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then((u) => setUser(u))
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await logoutApi();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
