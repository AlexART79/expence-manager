type Fetcher = typeof fetch;

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;

  public constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly fetcher: Fetcher;

  public constructor(baseUrl: string, fetcher: Fetcher = (...args) => globalThis.fetch(...args)) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.fetcher = fetcher;
  }

  public async get<T>(path: string): Promise<T> {
    const response = await this.fetcher(`${this.baseUrl}${this.normalizePath(path)}`, {
      credentials: "include",
      headers: { Accept: "application/json" }
    });

    return this.handleResponse<T>(response);
  }

  public async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await this.fetcher(`${this.baseUrl}${this.normalizePath(path)}`, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });

    return this.handleResponse<T>(response);
  }

  public async put<T>(path: string, body?: unknown): Promise<T> {
    const response = await this.fetcher(`${this.baseUrl}${this.normalizePath(path)}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });

    return this.handleResponse<T>(response);
  }

  public async patch<T>(path: string, body?: unknown): Promise<T> {
    const response = await this.fetcher(`${this.baseUrl}${this.normalizePath(path)}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });

    return this.handleResponse<T>(response);
  }

  public async delete<T>(path: string): Promise<T> {
    const response = await this.fetcher(`${this.baseUrl}${this.normalizePath(path)}`, {
      method: "DELETE",
      credentials: "include",
      headers: { Accept: "application/json" }
    });

    return this.handleResponse<T>(response);
  }

  public buildUrl(path: string) {
    return `${this.baseUrl}${this.normalizePath(path)}`;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const body = await this.readJsonBody(response);

    if (!response.ok) {
      const { message, code } = this.extractError(body, response.status);
      throw new ApiError(message, response.status, code);
    }

    return body as T;
  }

  private async readJsonBody(response: Response): Promise<unknown> {
    if (response.status === 204) {
      return null;
    }

    try {
      return (await response.json()) as unknown;
    } catch {
      return null;
    }
  }

  private normalizePath(path: string) {
    return path.startsWith("/") ? path : `/${path}`;
  }

  private extractError(body: unknown, status: number) {
    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "object" &&
      body.error !== null &&
      "message" in body.error &&
      typeof body.error.message === "string"
    ) {
      return {
        message: body.error.message,
        code: this.extractErrorCode(body as ApiErrorBody)
      };
    }

    return {
      message: `API request failed with status ${status}`,
      code: undefined
    };
  }

  private extractErrorCode(body: ApiErrorBody) {
    return typeof body.error?.code === "string" ? body.error.code : undefined;
  }
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export const apiClient = new ApiClient(API_BASE_URL);
