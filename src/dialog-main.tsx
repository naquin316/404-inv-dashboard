import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import DialogApp from './DialogApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DialogApp />
  </StrictMode>,
)
