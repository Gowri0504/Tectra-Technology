import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import pino from 'pino';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();
const logger = pino({
  transport: {
    target: 'pino-pretty',
  },
});

app.use(helmet());
app.use(cors());
app.use(express.json());

import { generalLimiter } from './middlewares/rateLimiter';
import { metricsHandler, httpRequestDurationMicroseconds } from './utils/metrics';
import { v4 as uuidv4 } from 'uuid';

app.use((req, res, next) => {
  const start = Date.now();
  const requestId = uuidv4();
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDurationMicroseconds
      .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
      .observe(duration);
  });
  next();
});

app.use(generalLimiter);

app.get('/metrics', metricsHandler);

import authRoutes from './routes/authRoutes';
import transactionRoutes from './routes/transactionRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export { logger };
