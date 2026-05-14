/**
 * Authentication Store (Zustand)
 * 
 * This module provides global state management for authentication using Zustand.
 * It manages user data, authentication token, and authentication state across the application.
 * The store persists data to localStorage to maintain authentication across page refreshes.
 * 
 * @module services/state/authStore
 * 
 * @remarks
 * This store uses Zustand's persist middleware to automatically save/restore
 * authentication state from localStorage. This ensures users remain logged in
 * even after refreshing the page or closing the browser.
 * 
 * @example
 * ```typescript
 * import { useAuthStore } from './services/state/authStore';
 * 
 * // In a component:
 * const { user, isAuthenticated, login, logout } = useAuthStore();
 * 
 * // Login
 * login(userData, token);
 * 
 * // Check authentication
 * if (isAuthenticated) {
 *   // User is logged in
 * }
 * 
 * // Logout
 * logout();
 * ```
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * User interface
 * 
 * Represents authenticated user information.
 * 
 * @interface User
 * @property {number} id - User ID
 * @property {string} username - Username
 * @property {string} role - User role (Admin, Accountant, Employee, Management)
 */
interface User {
  id: number;
  username: string;
  role: string;
}

/**
 * Authentication state interface
 * 
 * Defines the shape of the authentication store state and actions.
 * 
 * @interface AuthState
 * @property {User | null} user - Current authenticated user, null if not logged in
 * @property {string | null} token - JWT authentication token, null if not logged in
 * @property {boolean} isAuthenticated - Whether user is currently authenticated
 * @property {Function} login - Function to set user and token (login action)
 * @property {Function} logout - Function to clear user and token (logout action)
 */
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

/**
 * Authentication Store Hook
 * 
 * Zustand store for managing authentication state.
 * Uses persist middleware to save state to localStorage with key 'auth-storage'.
 * 
 * @constant {Function} useAuthStore
 * @returns {AuthState} Authentication state and actions
 * 
 * @example
 * ```typescript
 * // Get state and actions
 * const { user, token, isAuthenticated, login, logout } = useAuthStore();
 * 
 * // Access user data
 * console.log(user?.username);
 * 
 * // Check if authenticated
 * if (isAuthenticated) {
 *   // Show protected content
 * }
 * ```
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,

      /**
       * Login action
       * 
       * Sets user data and token, marks user as authenticated.
       * Also saves token to localStorage for API client interceptor.
       * 
       * @param {User} user - User data to store
       * @param {string} token - JWT token to store
       * 
       * @example
       * ```typescript
       * login({
       *   id: 1,
       *   username: 'john_doe',
       *   role: 'Employee'
       * }, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
       * ```
       */
      login: (user: User, token: string) => {
        // Save token to localStorage for API client
        localStorage.setItem('token', token);
        
        // Update store state
        set({ user, token, isAuthenticated: true });
      },

      /**
       * Logout action
       * 
       * Clears user data, token, and authentication state.
       * Also removes token from localStorage.
       * 
       * @example
       * ```typescript
       * logout();
       * // User is now logged out, state cleared
       * ```
       */
      logout: () => {
        // Remove token from localStorage
        localStorage.removeItem('token');
        
        // Clear store state
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      // Persist configuration
      // Store will be saved to localStorage with this key
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Ensure isAuthenticated is synced with user and token
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
      // On rehydration, ensure isAuthenticated matches the presence of user and token
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Sync isAuthenticated with actual state
          if (state.user && state.token && !state.isAuthenticated) {
            state.isAuthenticated = true;
          } else if ((!state.user || !state.token) && state.isAuthenticated) {
            state.isAuthenticated = false;
          }
        }
      },
    }
  )
);

