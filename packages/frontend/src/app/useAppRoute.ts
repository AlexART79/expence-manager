import { useCallback, useEffect, useState } from "react";
import { BROWSER_EVENTS } from "./appConstants";
import type { AppRoute } from "./appConstants";
import { getRouteFromLocation, navigateTo } from "./appRouting";

export function useAppRoute() {
  const [route, setRoute] = useState<AppRoute>(() => getRouteFromLocation());
  const goToRoute = useCallback((nextRoute: AppRoute, replace = false) => navigateTo(nextRoute, setRoute, replace), []);

  useEffect(() => {
    const handlePopState = () => setRoute(getRouteFromLocation());
    window.addEventListener(BROWSER_EVENTS.popState, handlePopState);
    return () => window.removeEventListener(BROWSER_EVENTS.popState, handlePopState);
  }, []);

  return {
    route,
    navigateTo: goToRoute
  };
}
