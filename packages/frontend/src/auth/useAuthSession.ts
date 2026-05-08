import { useEffect, useState } from "react";
import { APP_MESSAGES } from "../app/appConstants";
import type { AppRoute } from "../app/appConstants";
import { APP_ROUTES } from "../app/appConstants";
import type { AuthClient, CurrentUser } from "./authClient";

export function useAuthSession(authClient: AuthClient, navigateTo: (route: AppRoute, replace?: boolean) => void) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    authClient
      .getCurrentUser()
      .then((currentUser) => {
        if (isCurrent) {
          setAuthError(null);
          setUser(currentUser);
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setAuthError(error instanceof Error ? error.message : APP_MESSAGES.sessionCheckFailed);
          setUser(null);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsBootstrapping(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [authClient]);

  async function logout() {
    await authClient.logout();
    setUser(null);
    navigateTo(APP_ROUTES.login, true);
  }

  return {
    user,
    authError,
    isBootstrapping,
    logout
  };
}
