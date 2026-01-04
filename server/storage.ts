import { db } from "./db";
import {
  transactions, debts, investments,
  type Transaction, type InsertTransaction,
  type Debt, type InsertDebt,
  type Investment, type InsertInvestment, type UpdateInvestmentRequest,
  type SummaryResponse
} from "@shared/schema";
import { eq, sum, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // Transactions
  getTransactions(filters?: { startDate?: string, endDate?: string, type?: string, limit?: number }): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  deleteTransaction(id: number): Promise<void>;

  // Debts
  getDebts(): Promise<(Debt & { paidAmount: number; remainingAmount: number; progress: number })[]>;
  createDebt(debt: InsertDebt): Promise<Debt>;
  deleteDebt(id: number): Promise<void>;

  // Investments
  getInvestments(): Promise<Investment[]>;
  createInvestment(investment: InsertInvestment): Promise<Investment>;
  updateInvestment(id: number, updates: UpdateInvestmentRequest): Promise<Investment | undefined>;
  deleteInvestment(id: number): Promise<void>;

  // Summary
  getSummary(): Promise<SummaryResponse>;
}

export class DatabaseStorage implements IStorage {
  async getTransactions(filters?: { startDate?: string, endDate?: string, type?: string, limit?: number }): Promise<Transaction[]> {
    let query = db.select().from(transactions).orderBy(desc(transactions.date));

    if (filters) {
      const conditions = [];
      if (filters.startDate) conditions.push(gte(transactions.date, new Date(filters.startDate)));
      if (filters.endDate) conditions.push(lte(transactions.date, new Date(filters.endDate)));
      if (filters.type) conditions.push(eq(transactions.type, filters.type as "income" | "expense" | "debt_payment"));
      
      if (conditions.length > 0) {
        query.where(and(...conditions));
      }

      if (filters.limit) {
        query.limit(filters.limit);
      }
    }

    return await query;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async deleteTransaction(id: number): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  async getDebts(): Promise<(Debt & { paidAmount: number; remainingAmount: number; progress: number })[]> {
    const allDebts = await db.select().from(debts);
    
    // Calculate progress for each debt
    const debtsWithProgress = await Promise.all(allDebts.map(async (debt) => {
      const payments = await db
        .select({ totalPaid: sum(transactions.amount) })
        .from(transactions)
        .where(and(
          eq(transactions.type, 'debt_payment'),
          eq(transactions.debtId, debt.id)
        ));
      
      const paidAmount = Number(payments[0]?.totalPaid || 0);
      const initialAmount = Number(debt.initialAmount);
      const remainingAmount = Math.max(0, initialAmount - paidAmount);
      const progress = initialAmount > 0 ? (paidAmount / initialAmount) * 100 : 0;

      return {
        ...debt,
        paidAmount,
        remainingAmount,
        progress
      };
    }));

    return debtsWithProgress;
  }

  async createDebt(debt: InsertDebt): Promise<Debt> {
    const [newDebt] = await db.insert(debts).values(debt).returning();
    return newDebt;
  }

  async deleteDebt(id: number): Promise<void> {
    await db.delete(debts).where(eq(debts.id, id));
  }

  async getInvestments(): Promise<Investment[]> {
    return await db.select().from(investments);
  }

  async createInvestment(investment: InsertInvestment): Promise<Investment> {
    const [newInvestment] = await db.insert(investments).values(investment).returning();
    return newInvestment;
  }

  async updateInvestment(id: number, updates: UpdateInvestmentRequest): Promise<Investment | undefined> {
    const [updated] = await db.update(investments).set({ ...updates, lastUpdated: new Date() }).where(eq(investments.id, id)).returning();
    return updated;
  }

  async deleteInvestment(id: number): Promise<void> {
    await db.delete(investments).where(eq(investments.id, id));
  }

  async getSummary(): Promise<SummaryResponse> {
    // 1. Total Income
    const incomeResult = await db.select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(eq(transactions.type, 'income'));
    const totalIncome = Number(incomeResult[0]?.total || 0);

    // 2. Total Expenses
    const expenseResult = await db.select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(eq(transactions.type, 'expense'));
    const totalExpenses = Number(expenseResult[0]?.total || 0);

    // 3. Debt Payments
    const debtPaymentResult = await db.select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(eq(transactions.type, 'debt_payment'));
    const totalDebtPayments = Number(debtPaymentResult[0]?.total || 0);

    // 4. Cash Balance = Income - (Expenses + Debt Payments)
    const cashBalance = totalIncome - (totalExpenses + totalDebtPayments);

    // 5. Remaining Debt
    // Get total initial debt
    const debtsResult = await db.select({ total: sum(debts.initialAmount) }).from(debts);
    const totalInitialDebt = Number(debtsResult[0]?.total || 0);
    const remainingDebt = Math.max(0, totalInitialDebt - totalDebtPayments);

    // 6. Investments Value
    const investmentsResult = await db.select({ total: sum(investments.currentValue) }).from(investments);
    const totalInvestmentsValue = Number(investmentsResult[0]?.total || 0);

    // 7. Net Position = Cash Balance + Investments - Remaining Debt
    const netPosition = cashBalance + totalInvestmentsValue - remainingDebt;

    return {
      totalIncome,
      totalExpenses,
      cashBalance,
      remainingDebt,
      netPosition
    };
  }
}

export const storage = new DatabaseStorage();
