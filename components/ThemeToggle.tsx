import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
const { theme, setTheme } = useTheme();

return (
<button
onClick={() => setTheme(theme === "light" ? "dark" : "light")}
className="p-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
aria-label="Toggle theme"
>
{theme === "light" ? (
<Sun className="h-5 w-5" />
) : (
<Moon className="h-5 w-5" />
)}
<span className="sr-only">Toggle theme</span>
</button>
);
} 