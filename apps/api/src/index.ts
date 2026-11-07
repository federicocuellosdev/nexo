import { crearApp } from './app.js';
import { config } from './config.js';

/**
 * Entry point para dev local (`npm run dev`). En producción (Vercel) no se
 * ejecuta este archivo: el runtime invoca directamente el handler de
 * `apps/api/api/[...path].ts`, que importa `crearApp()` sin levantar listener.
 */
const app = crearApp();

app.listen(config.puerto, () => {
  console.log(`[api] escuchando en http://localhost:${config.puerto}`);
  console.log(`[api] CORS allowlist: ${config.corsOrigins.join(', ')}`);
  console.log(`[api] Supabase: ${config.supabaseUrl}`);
});
