import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useThemeStore } from './services/state/themeStore'

// Initialize theme on app load
if (typeof document !== 'undefined') {
  const theme = useThemeStore.getState().theme;
  document.documentElement.setAttribute('data-theme', theme);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
