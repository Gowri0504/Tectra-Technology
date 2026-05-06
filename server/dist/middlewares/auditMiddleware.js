"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = void 0;
const auditRepository_1 = require("../repositories/auditRepository");
const logger_1 = require("../utils/logger");
const auditRepository = new auditRepository_1.AuditRepository();
const auditLog = (action, entityType) => {
    return async (req, res, next) => {
        const originalSend = res.send;
        res.send = function (body) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const payload = req.method === 'GET' ? null : req.body;
                auditRepository.createLog({
                    action,
                    entityType,
                    entityId: req.params.id,
                    payload: payload ? JSON.parse(JSON.stringify(payload)) : null,
                    userId: req.user?.userId,
                    organizationId: req.user?.orgId || '',
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                }).catch(err => logger_1.logger.error(err, 'Audit log error'));
            }
            return originalSend.call(this, body);
        };
        next();
    };
};
exports.auditLog = auditLog;
