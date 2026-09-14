import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/index.css';
import { App } from '@/App';

const contenedor = document.getElementById('root');
if (!contenedor) throw new Error('No existe #root en index.html');

/* Marca el documento como "JS activo". Todo estado oculto del sistema de motion
   (src/styles/motion.css) cuelga de esta clase, así que si el bundle no llega o
   falla, la página se ve entera en vez de quedar en blanco. Va acá y no en el
   HTML estático justamente para que sea prueba de que el JS corrió. */
document.documentElement.classList.add('js');

createRoot(contenedor).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
