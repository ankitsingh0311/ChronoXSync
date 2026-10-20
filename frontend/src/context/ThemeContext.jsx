// =============================================================================
// EduTrack 3D — Theme Context Provider (ThemeContext.jsx)
// =============================================================================
// 3D UI/UX: Dual theme switcher between "Obsidian Nebula" (dark) and
// "Daylight Alabaster" (light) modes. Persists preference in localStorage.
// =============================================================================

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('edutrack_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('edutrack_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const themeName = theme === 'dark' ? 'Obsidian Studio' : 'Warm Cream';

  return (
    <ThemeContext.Provider value={{ theme, themeName, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
