import { useState } from "react";

export function useAvatarFallback(avatarUrl: string | null) {
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const shouldShowAvatar = Boolean(avatarUrl && failedAvatarUrl !== avatarUrl);

  return {
    shouldShowAvatar,
    handleAvatarError: () => setFailedAvatarUrl(avatarUrl)
  };
}
