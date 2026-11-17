import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppStateProvider } from './state/AppStateContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode><AppStateProvider><App /></AppStateProvider></StrictMode>,
);
