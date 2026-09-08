import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/index.css';
import { App } from '@/App';

const contenedor = document.getElementById('root');
if (!contenedor) throw new Error('No existe #root en index.html');

createRoot(contenedor).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
