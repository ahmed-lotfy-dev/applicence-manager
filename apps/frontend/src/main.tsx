import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AppQueryProvider } from './app/providers/QueryProvider.tsx'
import { AppI18nProvider } from './shared/i18n/I18nProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppI18nProvider>
      <BrowserRouter>
        <AppQueryProvider>
          <App />
        </AppQueryProvider>
      </BrowserRouter>
    </AppI18nProvider>
  </StrictMode>,
)
