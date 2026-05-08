import { useEffect, useState } from "react";
import type { CurrentUser } from "../auth/authClient";

type UserMenuProps = {
  user: CurrentUser;
  onLogout: () => void;
};

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const [hasAvatarError, setHasAvatarError] = useState(false);
  const shouldShowAvatar = Boolean(user.avatarUrl && !hasAvatarError);

  useEffect(() => {
    setHasAvatarError(false);
  }, [user.avatarUrl]);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-surface-muted px-3 py-2">
      {shouldShowAvatar ? (
        <img
          className="h-9 w-9 rounded-full object-cover"
          src={user.avatarUrl ?? undefined}
          alt={`${user.displayName} avatar`}
          referrerPolicy="no-referrer"
          onError={() => setHasAvatarError(true)}
        />
      ) : (
        <div
          className="grid h-9 w-9 place-items-center rounded-full bg-accent text-sm font-bold text-slate-950"
          aria-label={`${user.displayName} initials`}
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
        className="inline-flex min-h-9 items-center justify-center rounded-md border border-white/10 px-3 text-sm font-medium text-text transition hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-slate-950"
        onClick={onLogout}
      >
        Log out
      </button>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
