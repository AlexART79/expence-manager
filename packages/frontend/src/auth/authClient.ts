import { z } from "zod";
import { apiClient, type ApiClient } from "../lib/apiClient";

export type AuthProvider = "google" | "github";

const currentUserSchema = z.object({
  id: z.number(),
  provider: z.enum(["google", "github"]),
  email: z.string().nullable(),
  displayName: z.string(),
  avatarUrl: z.string().nullable()
});

const currentUserResponseSchema = z.object({
  user: currentUserSchema
});

export type CurrentUser = z.infer<typeof currentUserSchema>;

export class AuthClient {
  private readonly api: ApiClient;

  public constructor(api: ApiClient) {
    this.api = api;
  }

  public async getCurrentUser(): Promise<CurrentUser | null> {
    try {
      const body = await this.api.get<unknown>("/auth/me");
      return currentUserResponseSchema.parse(body).user;
    } catch (error) {
      if (error instanceof Error && error.message === "Authentication required") {
        return null;
      }

      throw error;
    }
  }

  public async logout(): Promise<void> {
    await this.api.post<void>("/auth/logout");
  }

  public getProviderLoginUrl(provider: AuthProvider) {
    return this.api.buildUrl(`/auth/${provider}/start`);
  }
}

export const authClient = new AuthClient(apiClient);
