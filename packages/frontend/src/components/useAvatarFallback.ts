import { useEffect, useState } from "react";

export function useAvatarFallback(avatarUrl: string | null) {
  const [hasAvatarError, setHasAvatarError] = useState(false);
  const shouldShowAvatar = Boolean(avatarUrl && !hasAvatarError);

  useEffect(() => {
    setHasAvatarError(false);
  }, [avatarUrl]);

  return {
    shouldShowAvatar,
    handleAvatarError: () => setHasAvatarError(true)
  };
}
