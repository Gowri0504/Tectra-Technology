import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { logger } from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(cookieParser());

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
import budgetRoutes from './routes/budgetRoutes';
import userRoutes from './routes/userRoutes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/users', userRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

import prisma from './config/prisma';
import redis from './config/redis';

const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');
  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await prisma.$disconnect();
      logger.info('Prisma disconnected.');
      await redis.quit();
      logger.info('Redis disconnected.');
      process.exit(0);
    } catch (err) {
      logger.error(err, 'Error during graceful shutdown');
      process.exit(1);
    }
  });

  // Force shutdown after 10s
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
