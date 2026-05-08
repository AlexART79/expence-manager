import { APP_ROUTES, HISTORY_METHODS } from "./appConstants";
import type { AppRoute } from "./appConstants";

export function getRouteFromLocation(): AppRoute {
  return window.location.pathname === APP_ROUTES.login ? APP_ROUTES.login : APP_ROUTES.home;
}

export function navigateTo(route: AppRoute, setRoute: (route: AppRoute) => void, replace = false) {
  if (window.location.pathname !== route) {
    const method = replace ? HISTORY_METHODS.replace : HISTORY_METHODS.push;
    window.history[method]({}, "", route);
  }
  setRoute(route);
}
