import type { CurrentUser } from "../auth/authClient";
import { useAvatarFallback } from "./useAvatarFallback";
import { getInitials } from "./userDisplay";
import { USER_MENU_COPY, USER_MENU_IMAGE } from "./userMenuConstants";

type UserMenuProps = {
  user: CurrentUser;
  onLogout: () => void;
};

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const { shouldShowAvatar, handleAvatarError } = useAvatarFallback(user.avatarUrl);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-line/30 bg-surface-muted px-3 py-2 dark:border-line/10">
      {shouldShowAvatar ? (
        <img
          className="h-9 w-9 rounded-full object-cover"
          src={user.avatarUrl ?? undefined}
          alt={USER_MENU_COPY.avatarAlt(user.displayName)}
          referrerPolicy={USER_MENU_IMAGE.referrerPolicy}
          onError={handleAvatarError}
        />
      ) : (
        <div
          className="grid h-9 w-9 place-items-center rounded-full bg-teal-600 text-sm font-bold text-white dark:bg-accent dark:text-slate-950"
          aria-label={USER_MENU_COPY.initialsLabel(user.displayName)}
        >
          {getInitials(user.displayName)}
        </div>
      )}
      <div className="hidden min-w-0 sm:block">
        <p className="truncate text-sm font-semibold text-text">{user.displayName}</p>
        <p className="text-xs capitalize text-text-muted">{user.provider}</p>
      </div>
      <button
        type="button"
        className="inline-flex min-h-9 items-center justify-center rounded-md border border-line bg-control px-3 text-sm font-medium text-text transition hover:bg-control-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:border-white/10 dark:bg-transparent dark:hover:bg-surface dark:focus:ring-offset-slate-950"
        onClick={onLogout}
      >
        {USER_MENU_COPY.logout}
      </button>
    </div>
  );
}
