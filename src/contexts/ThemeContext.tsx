'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'classic' | 'vibrant';

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
  const [theme, setTheme] = useState<Theme>('vibrant'); // Default to vibrant theme
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load theme from localStorage on mount, default to vibrant if none saved
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && (savedTheme === 'classic' || savedTheme === 'vibrant')) {
      setTheme(savedTheme);
    } else {
      // Set vibrant as default and save it
      setTheme('vibrant');
      localStorage.setItem('theme', 'vibrant');
    }
    setMounted(true);
  }, []);}]}}}

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
    setTheme(prev => prev === 'classic' ? 'vibrant' : 'classic');
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;