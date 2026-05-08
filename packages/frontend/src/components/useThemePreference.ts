import { useState } from "react";

export function useThemePreference(defaultIsDark = true) {
  const [isDark, setIsDark] = useState(defaultIsDark);

  return {
    isDark,
    setIsDark
  };
}
