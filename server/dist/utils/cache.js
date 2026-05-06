"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = void 0;
const redis_1 = __importDefault(require("../config/redis"));
exports.cache = {
    async get(key) {
        const data = await redis_1.default.get(key);
        return data ? JSON.parse(data) : null;
    },
    async set(key, value, ttlSeconds = 3600) {
        await redis_1.default.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    },
    async del(key) {
        await redis_1.default.del(key);
    },
    async delByPrefix(prefix) {
        const keys = await redis_1.default.keys(`${prefix}*`);
        if (keys.length > 0) {
            await redis_1.default.del(...keys);
        }
    },
};
