import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Summary
  app.get(api.summary.get.path, async (_req, res) => {
    const summary = await storage.getSummary();
    res.json(summary);
  });

  // Transactions
  app.get(api.transactions.list.path, async (req, res) => {
    const filters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      type: req.query.type as string,
      limit: req.query.limit ? Number(req.query.limit) : undefined
    };
    const items = await storage.getTransactions(filters);
    res.json(items);
  });

  app.post(api.transactions.create.path, async (req, res) => {
    try {
      const body = {
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : new Date(),
      };
      const input = api.transactions.create.input.parse(body);
      const item = await storage.createTransaction(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.transactions.delete.path, async (req, res) => {
    await storage.deleteTransaction(Number(req.params.id));
    res.status(204).send();
  });

  // Debts
  app.get(api.debts.list.path, async (_req, res) => {
    const items = await storage.getDebts();
    res.json(items);
  });

  app.post(api.debts.create.path, async (req, res) => {
    try {
      const input = api.debts.create.input.parse(req.body);
      const item = await storage.createDebt(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.debts.delete.path, async (req, res) => {
    await storage.deleteDebt(Number(req.params.id));
    res.status(204).send();
  });

  // Investments
  app.get(api.investments.list.path, async (_req, res) => {
    const items = await storage.getInvestments();
    res.json(items);
  });

  app.post(api.investments.create.path, async (req, res) => {
    try {
      const input = api.investments.create.input.parse(req.body);
      const item = await storage.createInvestment(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.investments.update.path, async (req, res) => {
    try {
      const input = api.investments.update.input.parse(req.body);
      const item = await storage.updateInvestment(Number(req.params.id), input);
      if (!item) {
        return res.status(404).json({ message: "Investment not found" });
      }
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.investments.delete.path, async (req, res) => {
    await storage.deleteInvestment(Number(req.params.id));
    res.status(204).send();
  });

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingTransactions = await storage.getTransactions({ limit: 1 });
  if (existingTransactions.length === 0) {
    // Create a seed debt
    const carLoan = await storage.createDebt({
      name: "Car Loan",
      initialAmount: "50000.00"
    });

    // Create seed investments
    await storage.createInvestment({
      name: "S&P 500 ETF",
      investedAmount: "10000.00",
      currentValue: "12500.00"
    });

    // Create seed transactions
    // Income
    await storage.createTransaction({
      type: "income",
      category: "Salary",
      amount: "8500.00",
      date: new Date(Date.now() - 86400000 * 5), // 5 days ago
      notes: "Monthly salary"
    });

    // Expenses
    await storage.createTransaction({
      type: "expense",
      category: "Rent",
      amount: "2500.00",
      date: new Date(Date.now() - 86400000 * 4),
      notes: "Apartment rent"
    });

    await storage.createTransaction({
      type: "expense",
      category: "Groceries",
      amount: "450.50",
      date: new Date(Date.now() - 86400000 * 2),
      notes: "Weekly shopping"
    });

    // Debt Payment
    await storage.createTransaction({
      type: "debt_payment",
      category: "Loan Repayment",
      amount: "1000.00",
      date: new Date(Date.now() - 86400000 * 1),
      notes: "Car loan installment",
      debtId: carLoan.id
    });
  }
}
