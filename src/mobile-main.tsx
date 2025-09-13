import { createRoot } from 'react-dom/client'
import MobileApp from './mobile/App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<MobileApp />);