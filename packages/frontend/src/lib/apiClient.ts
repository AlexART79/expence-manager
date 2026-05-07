type Fetcher = typeof fetch;

export class ApiClient {
  private readonly baseUrl: string;
  private readonly fetcher: Fetcher;

  public constructor(baseUrl: string, fetcher: Fetcher = fetch) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.fetcher = fetcher;
  }

  public async get<T>(path: string): Promise<T> {
    const response = await this.fetcher(`${this.baseUrl}${this.normalizePath(path)}`, {
      credentials: "include",
      headers: { Accept: "application/json" }
    });

    const body = (await response.json()) as unknown;

    if (!response.ok) {
      throw new Error(this.extractErrorMessage(body, response.status));
    }

    return body as T;
  }

  private normalizePath(path: string) {
    return path.startsWith("/") ? path : `/${path}`;
  }

  private extractErrorMessage(body: unknown, status: number) {
    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "object" &&
      body.error !== null &&
      "message" in body.error &&
      typeof body.error.message === "string"
    ) {
      return body.error.message;
    }

    return `API request failed with status ${status}`;
  }
}

export const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000");
