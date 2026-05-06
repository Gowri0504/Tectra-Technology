import * as fastcsv from 'fast-csv';
import { Response } from 'express';
import prisma from '../config/prisma';

export class ExportService {
  async streamTransactionsToCsv(res: Response, orgId: string) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');

    const csvStream = fastcsv.format({ headers: true });
    csvStream.pipe(res);

    // We use a cursor-based approach or just fetch in batches to avoid loading all in memory
    // For simplicity with Prisma, we can use findMany with cursor or just fetch and write
    // To properly stream with Prisma, we'd ideally use a raw query with a cursor or stream
    
    const transactions = await prisma.transaction.findMany({
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
