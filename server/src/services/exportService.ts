import * as fastcsv from 'fast-csv';
import { Response } from 'express';
import prisma from '../config/prisma';

export class ExportService {
  async streamTransactionsToCSV(res: Response, orgId: string, userId?: string, role?: string) {
    const csvStream = fastcsv.format({ headers: true });
    csvStream.pipe(res);

    const batchSize = 1000;
    let cursorId: string | undefined;

    // If role is USER, only allow exporting own transactions
    const filterUserId = role === 'USER' ? userId : undefined;

    while (true) {
      const transactions = await prisma.transaction.findMany({
        where: { 
          organizationId: orgId,
          userId: filterUserId,
        },
        take: batchSize,
        skip: cursorId ? 1 : 0,
        cursor: cursorId ? { id: cursorId } : undefined,
        orderBy: { id: 'asc' },
      });

      if (transactions.length === 0) break;

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

      cursorId = transactions[transactions.length - 1].id;
      if (transactions.length < batchSize) break;
    }

    csvStream.end();
  }
}
