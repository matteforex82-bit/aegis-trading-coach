'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'classic' | 'fintech' | 'neon';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('fintech'); // Default to fintech theme
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load theme from localStorage on mount, default to fintech if none saved
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && (savedTheme === 'classic' || savedTheme === 'fintech' || savedTheme === 'neon')) {
      setTheme(savedTheme);
    } else {
      // Set fintech as default and save it
      setTheme('fintech');
      localStorage.setItem('theme', 'fintech');
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Save theme to localStorage
      localStorage.setItem('theme', theme);
      
      // Apply theme to document root
      document.documentElement.setAttribute('data-theme', theme);
      
      // Add theme class to body for CSS transitions
      document.body.className = document.body.className.replace(/theme-\w+/g, '');
      document.body.classList.add(`theme-${theme}`);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'classic') return 'fintech';
      if (prev === 'fintech') return 'neon';
      return 'classic';
    });
  };

  // Prevent hydration mismatch by providing a default theme during mounting
  const contextValue = {
    theme: mounted ? theme : 'fintech' as Theme,
    setTheme,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;