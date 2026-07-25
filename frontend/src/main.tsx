import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initThemeListener } from './store/useThemeStore'

// Keeps "system" preference in sync with the OS after the initial paint,
// which index.html's inline script already handled.
initThemeListener()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
