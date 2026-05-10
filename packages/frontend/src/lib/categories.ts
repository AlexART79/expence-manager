import { api } from './apiClient.ts';

export interface Category {
  id: number;
  userId: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export async function listCategories(): Promise<Category[]> {
  return api.get<Category[]>('/api/categories');
}

export async function createCategory(name: string): Promise<Category> {
  return api.post<Category>('/api/categories', { name });
}

export async function renameCategory(id: number, name: string): Promise<Category> {
  return api.put<Category>(`/api/categories/${id}`, { name });
}

export async function deleteCategory(id: number): Promise<void> {
  return api.delete<void>(`/api/categories/${id}`);
}
