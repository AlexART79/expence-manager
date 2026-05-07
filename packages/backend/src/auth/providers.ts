import { z } from "zod";
import type { AppEnv } from "../env.js";
import { ApiError } from "../errors.js";
import { getTestProviderUser } from "./testProvider.js";
import type { AuthProvider, ProviderUser } from "./types.js";

export const providerSchema = z.enum(["google", "github"]);

const googleTokenSchema = z.object({
  access_token: z.string()
});

const googleProfileSchema = z.object({
  sub: z.string(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  picture: z.string().url().optional()
});

const githubTokenSchema = z.object({
  access_token: z.string()
});

const githubProfileSchema = z.object({
  id: z.union([z.number(), z.string()]).transform(String),
  login: z.string(),
  name: z.string().nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  email: z.string().email().nullable().optional()
});

export function buildProviderStartUrl(provider: AuthProvider, env: AppEnv) {
  if (provider === "google") {
    const params = new URLSearchParams({
      client_id: env.googleClientId,
      redirect_uri: env.googleRedirectUri,
      response_type: "code",
      scope: "openid email profile"
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  const params = new URLSearchParams({
    client_id: env.githubClientId,
    redirect_uri: env.githubRedirectUri,
    scope: "read:user user:email"
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeProviderCode(provider: AuthProvider, code: string, env: AppEnv): Promise<ProviderUser> {
  if (env.authTestMode) {
    return getTestProviderUser(provider, code);
  }

  return provider === "google" ? exchangeGoogleCode(code, env) : exchangeGitHubCode(code, env);
}

async function exchangeGoogleCode(code: string, env: AppEnv): Promise<ProviderUser> {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: env.googleRedirectUri
    })
  });

  if (!tokenResponse.ok) {
    throw new ApiError(400, "AUTH_ERROR", "Google authentication failed");
  }

  const token = googleTokenSchema.parse(await tokenResponse.json());
  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Accept: "application/json", Authorization: `Bearer ${token.access_token}` }
  });

  if (!profileResponse.ok) {
    throw new ApiError(400, "AUTH_ERROR", "Google profile lookup failed");
  }

  const profile = googleProfileSchema.parse(await profileResponse.json());
  return {
    provider: "google",
    providerUserId: profile.sub,
    email: profile.email ?? null,
    displayName: profile.name ?? "Google user",
    avatarUrl: profile.picture ?? null
  };
}

async function exchangeGitHubCode(code: string, env: AppEnv): Promise<ProviderUser> {
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.githubClientId,
      client_secret: env.githubClientSecret,
      code,
      redirect_uri: env.githubRedirectUri
    })
  });

  if (!tokenResponse.ok) {
    throw new ApiError(400, "AUTH_ERROR", "GitHub authentication failed");
  }

  const token = githubTokenSchema.parse(await tokenResponse.json());
  const profileResponse = await fetch("https://api.github.com/user", {
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token.access_token}` }
  });

  if (!profileResponse.ok) {
    throw new ApiError(400, "AUTH_ERROR", "GitHub profile lookup failed");
  }

  const profile = githubProfileSchema.parse(await profileResponse.json());
  return {
    provider: "github",
    providerUserId: profile.id,
    email: profile.email ?? null,
    displayName: profile.name ?? profile.login,
    avatarUrl: profile.avatar_url ?? null
  };
}
