import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// キーボード表示時にレイアウト高さが変わらないよう初期高さをCSS変数にロック
function lockViewportHeight() {
  document.documentElement.style.setProperty('--locked-vh', `${window.innerHeight}px`)
}
lockViewportHeight()
// 画面回転時のみ更新（キーボード開閉では更新しない）
window.addEventListener('orientationchange', () => setTimeout(lockViewportHeight, 300))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
