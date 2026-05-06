import { Worker } from 'bullmq';
import redis from '../config/redis';
import { logger } from '../utils/logger';
import { sendEmail } from '../utils/mailService';

export const exportWorker = new Worker('export-queue', async (job) => {
  const { orgId, email } = job.data;
  logger.info(`Processing export for org: ${orgId}`);

  try {
    // In a real app, we'd save to S3 and send link
    // Here we'll simulate by generating and "notifying"
    await sendEmail(
      email,
      'Your Transaction Export is Ready',
      '<p>Your export has been processed and is ready for download.</p>'
    );
  } catch (error) {
    logger.error(error, 'Export worker error');
    throw error;
  }
}, { connection: redis });

export const reportWorker = new Worker('report-queue', async (job) => {
  const { email, type } = job.data;
  
  if (type === 'BUDGET_ALERT') {
    await sendEmail(
      email,
      'Budget Limit Exceeded!',
      `<p>Warning: You have exceeded your budget for a category.</p>`
    );
  }
}, { connection: redis });

logger.info('Workers started');
