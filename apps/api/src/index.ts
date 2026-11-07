import express from 'express';
import cors from 'cors';
import { config } from '@/config.js';
import { leadsRouter } from '@/routes/leads.js';

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

app.listen(config.puerto, () => {
  console.log(`[api] escuchando en http://localhost:${config.puerto}`);
  console.log(`[api] CORS allowlist: ${config.corsOrigins.join(', ')}`);
  console.log(`[api] Supabase: ${config.supabaseUrl}`);
});
