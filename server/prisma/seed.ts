import { PrismaClient, Role, TransactionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Organization
  const org = await prisma.organization.upsert({
    where: { id: 'default-org-id' },
    update: {},
    create: {
      id: 'default-org-id',
      name: 'Tectra Technology Corp',
    },
  });

  // 2. Create Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tectra.com' },
    update: {},
    create: {
      email: 'admin@tectra.com',
      password: hashedPassword,
      role: Role.ADMIN,
      organizationId: org.id,
    },
  });

  // 3. Create Accountant User
  const accountantPassword = await bcrypt.hash('accountant123', 10);
  await prisma.user.upsert({
    where: { email: 'accountant@tectra.com' },
    update: {},
    create: {
      email: 'accountant@tectra.com',
      password: accountantPassword,
      role: Role.ACCOUNTANT,
      organizationId: org.id,
    },
  });

  // 4. Create Regular User
  const userPassword = await bcrypt.hash('user123', 10);
  await prisma.user.upsert({
    where: { email: 'user@tectra.com' },
    update: {},
    create: {
      email: 'user@tectra.com',
      password: userPassword,
      role: Role.USER,
      organizationId: org.id,
    },
  });

  // 5. Create some Categories and Transactions
  const categories = ['Salary', 'Food', 'Rent', 'Utilities', 'Software', 'Hardware'];
  
  for (const category of categories) {
    // Create Budget for each category
    await prisma.budget.upsert({
      where: {
        category_period_organizationId: {
          category,
          period: '2026-05',
          organizationId: org.id,
        },
      },
      update: {},
      create: {
        category,
        amount: 5000,
        period: '2026-05',
        organizationId: org.id,
      },
    });

    // Create a transaction for each category
    await prisma.transaction.create({
      data: {
        amount: Math.floor(Math.random() * 1000) + 100,
        type: category === 'Salary' ? TransactionType.INCOME : TransactionType.EXPENSE,
        description: `Monthly ${category}`,
        category,
        organizationId: org.id,
        userId: admin.id,
        date: new Date(),
      },
    });
  }

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
