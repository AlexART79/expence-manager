import { api, ApiError } from './apiClient.ts';

export interface CurrentUser {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  provider: string;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    return await api.get<CurrentUser>('/api/auth/me');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      return null;
    }
    throw err;
  }
}

export async function logout(): Promise<void> {
  await api.post('/api/auth/logout', {});
}
