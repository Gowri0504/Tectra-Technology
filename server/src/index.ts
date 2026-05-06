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
app.use(generalLimiter);

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
