import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { AuthProvider } from './lib/AuthContext'
import { LastViewedSpotProvider } from './lib/LastViewedSpotContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LastViewedSpotProvider>
          <App />
        </LastViewedSpotProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
