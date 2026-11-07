import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Dos modos:
  //  - `vite dev`: Vite server standalone en 5174, montado en `/` → sin subpath.
  //  - `vite build`: el output se copia a `apps/landing/dist/app` y se sirve
  //    como subpath `/app/*` del dominio unificado nexo-front en Vercel. Por
  //    eso buildeamos con `base: '/app/'` → los asset URLs apuntan a
  //    `/app/assets/...` y no al root.
  base: command === 'serve' ? '/' : '/app/',
  // 5174: la landing ocupa el 5173. `strictPort` evita que Vite se corra de
  // puerto en silencio y rompa el handoff y el e2e.
  server: { port: 5174, strictPort: true },
  preview: { port: 5174, strictPort: true },
}));
