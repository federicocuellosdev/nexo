import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // 5174: la landing ocupa el 5173. `strictPort` evita que Vite se corra de
  // puerto en silencio y rompa el handoff y el e2e.
  server: { port: 5174, strictPort: true },
  preview: { port: 5174, strictPort: true },
});
