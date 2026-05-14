/**
 * Theme Store (Zustand)
 * 
 * This module provides global state management for theme (Light/Dark Mode) using Zustand.
 * It manages theme preference and persists it to localStorage.
 * 
 * @module services/state/themeStore
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Theme type
 */
export type Theme = 'light' | 'dark';

/**
 * Theme state interface
 */
interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

/**
 * Theme Store Hook
 * 
 * Zustand store for managing theme state.
 * Uses persist middleware to save theme preference to localStorage.
 * 
 * @constant {Function} useThemeStore
 * @returns {ThemeState} Theme state and actions
 * 
 * @example
 * ```typescript
 * // Get theme and actions
 * const { theme, toggleTheme, setTheme } = useThemeStore();
 * 
 * // Toggle theme
 * toggleTheme();
 * 
 * // Set specific theme
 * setTheme('dark');
 * ```
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      // Initial state - check system preference or default to light
      theme: (() => {
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('theme-storage');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              return parsed.state?.theme || 'light';
            } catch {
              return 'light';
            }
          }
          // Check system preference
          if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
          }
        }
        return 'light';
      })(),

      /**
       * Toggle theme between light and dark
       */
      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          // Apply theme to document
          if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', newTheme);
          }
          return { theme: newTheme };
        });
      },

      /**
       * Set specific theme
       * 
       * @param {Theme} theme - Theme to set ('light' or 'dark')
       */
      setTheme: (theme: Theme) => {
        set({ theme });
        // Apply theme to document
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme);
        }
      },
    }),
    {
      // Persist configuration
      name: 'theme-storage',
      storage: createJSONStorage(() => localStorage),
      // On rehydration, apply theme to document
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', state.theme);
        }
      },
    }
  )
);

// Initialize theme on store creation
if (typeof document !== 'undefined') {
  const initialState = useThemeStore.getState();
  document.documentElement.setAttribute('data-theme', initialState.theme);
}

