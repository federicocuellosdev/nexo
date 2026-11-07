import type { IncomingMessage, ServerResponse } from 'node:http';
import { crearApp } from '../src/app.js';

/**
 * Único handler de Vercel Functions. El `vercel.json` manda toda `/api/*` acá
 * y Express hace el matching de rutas como siempre, evitando duplicar el
 * routing en múltiples archivos `api/*.ts`.
 *
 * `crearApp()` se evalúa una vez (module-scope). Las lambdas warm reusan esa
 * instancia entre invocaciones — equivalente a un `app.listen()` sin socket.
 */
const app = crearApp();

export default function handler(req: IncomingMessage, res: ServerResponse): void {
  app(req, res);
}
