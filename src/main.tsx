import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProvider } from './AppContext.js'
import App from './App.js'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
)

