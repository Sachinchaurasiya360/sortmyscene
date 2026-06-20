import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Auth is Bearer-token based (no cookies), so reflecting any origin is safe.
  // Set CLIENT_ORIGIN (comma-separated) to lock it down to specific origins.
  const allowlist = process.env.CLIENT_ORIGIN
    ?.split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const corsOptions = {
    // `true` reflects the request's Origin header (allows all); a list restricts it.
    origin: allowlist && allowlist.length ? allowlist : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };

  app.use(cors(corsOptions));
  // Answer preflight requests for every route.
  app.options('*', cors(corsOptions));

  app.use(express.json());

  // Health / service-info routes (also handy as the deployment root).
  app.get('/', (req, res) =>
    res.json({ service: 'sortmyscene-api', status: 'ok', docs: '/api' })
  );
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  // Stop favicon probes from hitting the 404/error path.
  app.get('/favicon.ico', (req, res) => res.status(204).end());

  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
