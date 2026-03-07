import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const link =
  document.querySelector("link[rel='icon']") || document.createElement('link')
link.rel = 'icon'
link.type = 'image/svg+xml'
link.href = '/vite.svg?v=6'
document.head.appendChild(link)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
