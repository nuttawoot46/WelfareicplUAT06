
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Cell } from 'recharts';

// Make Cell available globally - this is a workaround since we can't edit the WelfareStatusChart.tsx file
window.Cell = Cell;

createRoot(document.getElementById("root")!).render(<App />);
