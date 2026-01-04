import { pgTable, text, serial, numeric, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===

export const debts = pgTable("debts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  initialAmount: numeric("initial_amount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  investedAmount: numeric("invested_amount", { precision: 12, scale: 2 }).notNull(),
  currentValue: numeric("current_value", { precision: 12, scale: 2 }).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull().defaultNow(),
  type: text("type", { enum: ["income", "expense", "debt_payment"] }).notNull(),
  category: text("category").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  debtId: integer("debt_id").references(() => debts.id), // Only for debt_payment
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const transactionsRelations = relations(transactions, ({ one }) => ({
  debt: one(debts, {
    fields: [transactions.debtId],
    references: [debts.id],
  }),
}));

export const debtsRelations = relations(debts, ({ many }) => ({
  payments: many(transactions),
}));

// === BASE SCHEMAS ===
export const insertDebtSchema = createInsertSchema(debts).omit({ id: true, createdAt: true });
export const insertInvestmentSchema = createInsertSchema(investments).omit({ id: true, lastUpdated: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Debt = typeof debts.$inferSelect;
export type InsertDebt = z.infer<typeof insertDebtSchema>;

export type Investment = typeof investments.$inferSelect;
export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

// Request types
export type CreateTransactionRequest = InsertTransaction;
export type CreateDebtRequest = InsertDebt;
export type CreateInvestmentRequest = InsertInvestment;
export type UpdateInvestmentRequest = Partial<InsertInvestment>;

// Response types
export type SummaryResponse = {
  totalIncome: number;
  totalExpenses: number;
  cashBalance: number;
  remainingDebt: number;
  netPosition: number;
};

export type DebtWithProgress = Debt & {
  paidAmount: number;
  remainingAmount: number;
  progress: number; // percentage
};
