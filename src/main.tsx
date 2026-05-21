import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// キーボード表示時に、フォーカス中の要素が隠れないよう #root 内でスクロール
document.addEventListener('focusin', (e) => {
  const target = e.target
  if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) return
  setTimeout(() => {
    target.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, 300)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
