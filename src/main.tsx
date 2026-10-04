import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import { App } from './app/App'
import { applyTheme, getTheme } from './lib/theme'
import { ensurePlanCache } from './plan/cache'
import { startSync } from './sync/engine'

applyTheme(getTheme())
void ensurePlanCache().then(() => startSync())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
