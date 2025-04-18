// components/ThemeTransition.tsx
'use client';
import React, { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";

export default function ThemeTransition() {
  const { theme } = useTheme();
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    const timeout = setTimeout(() => setShow(false), 350);
    return () => clearTimeout(timeout);
  }, [theme]);

  return show ? (
    <div
      className="fixed inset-0 pointer-events-none z-[9999] bg-white/70 dark:bg-black/70 animate-fadeTheme"
      aria-hidden="true"
    />
  ) : null;
}
