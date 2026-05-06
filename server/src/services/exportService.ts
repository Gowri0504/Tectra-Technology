import * as fastcsv from 'fast-csv';
import { Response } from 'express';
import prisma from '../config/prisma';

export class ExportService {
  async streamTransactionsToCsv(res: Response, orgId: string) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');

    const csvStream = fastcsv.format({ headers: true });
    csvStream.pipe(res);

    const batchSize = 1000;
    let cursorId: string | undefined;

    while (true) {
      const transactions = await prisma.transaction.findMany({
        where: { organizationId: orgId },
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
