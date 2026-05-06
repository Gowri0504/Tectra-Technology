"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionController = void 0;
const transactionService_1 = require("../services/transactionService");
const exportService_1 = require("../services/exportService");
const zod_1 = require("zod");
const transactionSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    type: zod_1.z.enum(['INCOME', 'EXPENSE']),
    description: zod_1.z.string().min(1),
    category: zod_1.z.string().min(1),
    date: zod_1.z.string().optional().transform(val => val ? new Date(val) : new Date()),
});
class TransactionController {
    constructor() {
        this.transactionService = new transactionService_1.TransactionService();
        this.exportService = new exportService_1.ExportService();
        this.create = async (req, res, next) => {
            try {
                const data = transactionSchema.parse(req.body);
                if (!req.user)
                    throw new Error('User not authenticated');
                const transaction = await this.transactionService.createTransaction(req.user.userId, req.user.orgId, data);
                res.status(201).json(transaction);
            }
            catch (error) {
                next(error);
            }
        };
        this.getAll = async (req, res, next) => {
            try {
                if (!req.user)
                    throw new Error('User not authenticated');
                const result = await this.transactionService.getTransactions(req.user.orgId, req.query);
                res.json(result);
            }
            catch (error) {
                next(error);
            }
        };
        this.getOne = async (req, res, next) => {
            try {
                if (!req.user)
                    throw new Error('User not authenticated');
                const transaction = await this.transactionService.getTransactionById(req.params.id, req.user.orgId);
                res.json(transaction);
            }
            catch (error) {
                next(error);
            }
        };
        this.update = async (req, res, next) => {
            try {
                if (!req.user)
                    throw new Error('User not authenticated');
                const data = transactionSchema.partial().parse(req.body);
                const result = await this.transactionService.updateTransaction(req.params.id, req.user.orgId, data);
                res.json(result);
            }
            catch (error) {
                next(error);
            }
        };
        this.delete = async (req, res, next) => {
            try {
                if (!req.user)
                    throw new Error('User not authenticated');
                const result = await this.transactionService.deleteTransaction(req.params.id, req.user.orgId);
                res.json(result);
            }
            catch (error) {
                next(error);
            }
        };
        this.getSummary = async (req, res, next) => {
            try {
                if (!req.user)
                    throw new Error('User not authenticated');
                const summary = await this.transactionService.getDashboardSummary(req.user.orgId);
                res.json(summary);
            }
            catch (error) {
                next(error);
            }
        };
        this.exportCsv = async (req, res, next) => {
            try {
                if (!req.user)
                    throw new Error('User not authenticated');
                await this.exportService.streamTransactionsToCsv(res, req.user.orgId);
            }
            catch (error) {
                next(error);
            }
        };
    }
}
exports.TransactionController = TransactionController;
