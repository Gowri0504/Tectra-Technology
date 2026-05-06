import { Queue } from 'bullmq';
import redis from './redis';

export const exportQueue = new Queue('export-queue', {
  connection: redis,
});

export const reportQueue = new Queue('report-queue', {
  connection: redis,
});
