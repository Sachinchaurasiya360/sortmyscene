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

  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
