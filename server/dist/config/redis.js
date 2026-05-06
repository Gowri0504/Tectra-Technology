"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new ioredis_1.default(REDIS_URL, {
    maxRetriesPerRequest: null,
});
redis.on('error', (err) => {
    logger_1.logger.error(err, 'Redis error');
});
redis.on('connect', () => {
    logger_1.logger.info('Connected to Redis');
});
exports.default = redis;
