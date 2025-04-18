'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
theme: Theme;
setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
const [mounted, setMounted] = useState(false);
const [theme, setTheme] = useState<Theme>('light');

// Set the theme
const updateTheme = (newTheme: Theme) => {
setTheme(newTheme);
// Update localStorage
localStorage.setItem('theme', newTheme);
// Update document class
if (newTheme === 'dark') {
document.documentElement.classList.add('dark');
} else {
document.documentElement.classList.remove('dark');
}
};

// Initialize theme from localStorage or system preference
useEffect(() => {
setMounted(true);
const savedTheme = localStorage.getItem('theme') as Theme | null;

if (savedTheme) {
updateTheme(savedTheme);
} else {
// Check system preference
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
updateTheme(systemTheme);
}
}, []);

// Listen for system theme changes
useEffect(() => {
if (!mounted) return;

const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

const handleChange = (e: MediaQueryListEvent) => {
if (localStorage.getItem('theme') === null) {
updateTheme(e.matches ? 'dark' : 'light');
}
};

mediaQuery.addEventListener('change', handleChange);
return () => mediaQuery.removeEventListener('change', handleChange);
}, [mounted]);

return (
<ThemeContext.Provider value={{
theme,
setTheme: updateTheme
}}>
{children}
</ThemeContext.Provider>
);
}

export function useTheme() {
const context = useContext(ThemeContext);
if (context === undefined) {
throw new Error('useTheme must be used within a ThemeProvider');
}
return context;
}