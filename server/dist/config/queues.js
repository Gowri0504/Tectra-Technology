"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportQueue = exports.exportQueue = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = __importDefault(require("./redis"));
exports.exportQueue = new bullmq_1.Queue('export-queue', {
    connection: redis_1.default,
});
exports.reportQueue = new bullmq_1.Queue('report-queue', {
    connection: redis_1.default,
});
