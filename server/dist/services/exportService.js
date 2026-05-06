"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
const fastcsv = __importStar(require("fast-csv"));
const prisma_1 = __importDefault(require("../config/prisma"));
class ExportService {
    async streamTransactionsToCsv(res, orgId) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
        const csvStream = fastcsv.format({ headers: true });
        csvStream.pipe(res);
        // We use a cursor-based approach or just fetch in batches to avoid loading all in memory
        // For simplicity with Prisma, we can use findMany with cursor or just fetch and write
        // To properly stream with Prisma, we'd ideally use a raw query with a cursor or stream
        const transactions = await prisma_1.default.transaction.findMany({
            where: { organizationId: orgId },
            orderBy: { date: 'desc' },
        });
        transactions.forEach((tx) => {
            csvStream.write({
                ID: tx.id,
                Amount: tx.amount.toString(),
                Type: tx.type,
                Description: tx.description,
                Category: tx.category,
                Date: tx.date.toISOString(),
            });
        });
        csvStream.end();
    }
}
exports.ExportService = ExportService;
