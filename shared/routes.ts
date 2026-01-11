import { z } from 'zod';
import { insertTransactionSchema, insertDebtSchema, insertInvestmentSchema, transactions, debts, investments } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  summary: {
    get: {
      method: 'GET' as const,
      path: '/api/summary',
      responses: {
        200: z.object({
          totalIncome: z.number(),
          totalExpenses: z.number(),
          cashBalance: z.number(),
          remainingDebt: z.number(),
          netPosition: z.number(),
        }),
      },
    },
  },
  transactions: {
    list: {
      method: 'GET' as const,
      path: '/api/transactions',
      input: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        type: z.enum(['income', 'expense', 'debt_payment']).optional(),
        limit: z.coerce.number().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof transactions.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/transactions',
      input: insertTransactionSchema,
      responses: {
        201: z.custom<typeof transactions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/transactions/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  debts: {
    list: {
      method: 'GET' as const,
      path: '/api/debts',
      responses: {
        200: z.array(z.custom<typeof debts.$inferSelect & { paidAmount: number; remainingAmount: number; progress: number }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/debts',
      input: insertDebtSchema,
      responses: {
        201: z.custom<typeof debts.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/debts/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  investments: {
    list: {
      method: 'GET' as const,
      path: '/api/investments',
      responses: {
        200: z.array(z.custom<typeof investments.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/investments',
      input: insertInvestmentSchema,
      responses: {
        201: z.custom<typeof investments.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/investments/:id',
      input: insertInvestmentSchema.partial(),
      responses: {
        200: z.custom<typeof investments.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/investments/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export type CreateDebtRequest = z.infer<typeof api.debts.create.input>;
export type CreateInvestmentRequest = z.infer<typeof api.investments.create.input>;
export type UpdateInvestmentRequest = z.infer<typeof api.investments.update.input>;

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
