import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AppQueryProvider } from './app/providers/QueryProvider.tsx'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppQueryProvider>
        <App />
      </AppQueryProvider>
    </BrowserRouter>
  </StrictMode>,
)
