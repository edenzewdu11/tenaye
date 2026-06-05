import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

const tg = window.Telegram?.WebApp
if (tg) {
  tg.ready()
  tg.expand()
  try { tg.setHeaderColor('#2563eb') } catch {}
  try { tg.setBackgroundColor('#f6f9ff') } catch {}
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
