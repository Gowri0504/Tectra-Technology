import client from 'prom-client';
import { Response, Request } from 'express';

const register = new client.Registry();

client.collectDefaultMetrics({ register });

export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in microseconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

register.registerMetric(httpRequestDurationMicroseconds);

export const transactionCount = new client.Counter({
  name: 'transaction_total_count',
  help: 'Total number of transactions created',
  labelNames: ['type', 'category', 'orgId'],
});

register.registerMetric(transactionCount);

export const loginCount = new client.Counter({
  name: 'login_total_count',
  help: 'Total number of logins',
  labelNames: ['status', 'orgId'],
});

register.registerMetric(loginCount);

export const metricsHandler = async (req: Request, res: Response) => {
  res.setHeader('Content-Type', register.contentType);
  res.end(await register.metrics());
};
