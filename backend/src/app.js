import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN?.split(',') || '*',
    })
  );
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
