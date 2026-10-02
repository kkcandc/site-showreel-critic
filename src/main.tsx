import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import '@fontsource/oxanium/700.css';
import '@fontsource/oxanium/800.css';
import '@fontsource/sora/400.css';
import '@fontsource/sora/600.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
