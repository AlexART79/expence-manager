export const APP_ROUTES = {
  home: "/",
  login: "/login"
} as const;

export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];

export const BROWSER_EVENTS = {
  popState: "popstate"
} as const;

export const HISTORY_METHODS = {
  push: "pushState",
  replace: "replaceState"
} as const;

export const APP_MESSAGES = {
  sessionCheckFailed: "Session check failed"
} as const;

export const THEME_CLASSES = {
  darkPrefix: "dark "
} as const;
