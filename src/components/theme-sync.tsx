"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

export function ThemeSync({ theme }: { theme: "LIGHT" | "DARK" | "SYSTEM" }) {
  const { setTheme } = useTheme();
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current) return;
    applied.current = true;
    setTheme(theme.toLowerCase());
  }, [setTheme, theme]);

  return null;
}
