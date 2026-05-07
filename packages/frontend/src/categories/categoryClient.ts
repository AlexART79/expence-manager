import { z } from "zod";
import { apiClient, type ApiClient } from "../lib/apiClient";

const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  createdAt: z.number(),
  updatedAt: z.number()
});

const categoryResponseSchema = z.object({
  category: categorySchema
});

const categoriesResponseSchema = z.object({
  categories: z.array(categorySchema)
});

export type Category = z.infer<typeof categorySchema>;

export class CategoryClient {
  private readonly api: ApiClient;

  public constructor(api: ApiClient) {
    this.api = api;
  }

  public async listCategories(): Promise<Category[]> {
    const body = await this.api.get<unknown>("/api/categories");
    return categoriesResponseSchema.parse(body).categories;
  }

  public async createCategory(name: string): Promise<Category> {
    const body = await this.api.post<unknown>("/api/categories", { name });
    return categoryResponseSchema.parse(body).category;
  }

  public async renameCategory(categoryId: number, name: string): Promise<Category> {
    const body = await this.api.patch<unknown>(`/api/categories/${categoryId}`, { name });
    return categoryResponseSchema.parse(body).category;
  }

  public async deleteCategory(categoryId: number): Promise<void> {
    await this.api.delete<void>(`/api/categories/${categoryId}`);
  }
}

export const categoryClient = new CategoryClient(apiClient);
