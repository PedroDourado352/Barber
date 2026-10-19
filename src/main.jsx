import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import { StoreProvider } from './lib/store'
import './styles/global.css'
import './styles/components.css'

const savedTheme = localStorage.getItem('barberly:theme')
const initialTheme =
  savedTheme === 'light' || savedTheme === 'dark'
    ? savedTheme
    : window.matchMedia?.('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'

document.documentElement.dataset.theme = initialTheme

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
)
