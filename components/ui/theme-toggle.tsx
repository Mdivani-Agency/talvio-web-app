"use client"

import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "./button";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Display mode"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? <SunIcon className="size-4 text-primary" /> : <MoonIcon className="size-4 text-primary" />}
    </Button>
  );
}
