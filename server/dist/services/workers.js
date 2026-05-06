"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportWorker = exports.exportWorker = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = __importDefault(require("../config/redis"));
const logger_1 = require("../utils/logger");
const mailService_1 = require("../utils/mailService");
exports.exportWorker = new bullmq_1.Worker('export-queue', async (job) => {
    const { orgId, email } = job.data;
    logger_1.logger.info(`Processing export for org: ${orgId}`);
    try {
        // In a real app, we'd save to S3 and send link
        // Here we'll simulate by generating and "notifying"
        await (0, mailService_1.sendEmail)(email, 'Your Transaction Export is Ready', '<p>Your export has been processed and is ready for download.</p>');
    }
    catch (error) {
        logger_1.logger.error(error, 'Export worker error');
        throw error;
    }
}, { connection: redis_1.default });
exports.reportWorker = new bullmq_1.Worker('report-queue', async (job) => {
    const { email, type } = job.data;
    if (type === 'BUDGET_ALERT') {
        await (0, mailService_1.sendEmail)(email, 'Budget Limit Exceeded!', `<p>Warning: You have exceeded your budget for a category.</p>`);
    }
}, { connection: redis_1.default });
logger_1.logger.info('Workers started');
