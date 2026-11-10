import express, { type Express } from 'express';
import cors from 'cors';
import { config } from './config.js';
import { leadsRouter } from './routes/leads.js';
import { authRouter } from './routes/auth.js';
import { subscriptionsRouter } from './routes/subscriptions.js';
import { webhooksRouter } from './routes/webhooks.js';
import { referidosRouter } from './routes/referidos.js';

/**
 * Crea la app Express. Se extrajo de `index.ts` para que la misma app sea
 * reusable desde el handler de Vercel Functions (apps/api/api/[...path].ts).
 * Dev local sigue arrancando con `index.ts` → `app.listen()`.
 */
export function crearApp(): Express {
  const app = express();

  // CORS: allowlist estricto de los orígenes de los dos frontends (landing y
  // portal v3). Postman / curl pasan sin problema porque no mandan Origin.
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (config.corsOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`Origin ${origin} no permitido`));
      },
    }),
  );

  app.use(express.json({ limit: '32kb' }));

  // Healthcheck para readiness probes y para verificar desde el browser que el
  // server está arriba sin tener que armar un POST válido.
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, ts: new Date().toISOString() });
  });

  app.use('/api', leadsRouter);
  app.use('/api', authRouter);
  app.use('/api', subscriptionsRouter);
  app.use('/api', webhooksRouter);
  app.use('/api', referidosRouter);

  return app;
}
