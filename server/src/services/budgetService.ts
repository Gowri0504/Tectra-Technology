import { BudgetRepository } from '../repositories/budgetRepository';

export class BudgetService {
  private budgetRepository = new BudgetRepository();

  async createOrUpdateBudget(orgId: string, category: string, period: string, amount: number) {
    return this.budgetRepository.upsert(orgId, category, period, amount);
  }

  async getBudgets(orgId: string, period?: string) {
    return this.budgetRepository.findMany(orgId, period);
  }
}
