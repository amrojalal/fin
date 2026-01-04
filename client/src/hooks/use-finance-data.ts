import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  api, 
  buildUrl, 
  type CreateDebtRequest, 
  type CreateInvestmentRequest, 
  type UpdateInvestmentRequest 
} from "@shared/routes";

// === SUMMARY ===
export function useSummary() {
  return useQuery({
    queryKey: [api.summary.get.path],
    queryFn: async () => {
      const res = await fetch(api.summary.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch summary");
      return api.summary.get.responses[200].parse(await res.json());
    },
  });
}

// === DEBTS ===
export function useDebts() {
  return useQuery({
    queryKey: [api.debts.list.path],
    queryFn: async () => {
      const res = await fetch(api.debts.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch debts");
      return api.debts.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateDebtRequest) => {
      const payload = { ...data, initialAmount: Number(data.initialAmount) };
      const res = await fetch(api.debts.create.path, {
        method: api.debts.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.debts.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create debt");
      }
      return api.debts.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.debts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.summary.get.path] });
    },
  });
}

export function useDeleteDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.debts.delete.path, { id });
      const res = await fetch(url, { 
        method: api.debts.delete.method,
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to delete debt");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.debts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.summary.get.path] });
    },
  });
}

// === INVESTMENTS ===
export function useInvestments() {
  return useQuery({
    queryKey: [api.investments.list.path],
    queryFn: async () => {
      const res = await fetch(api.investments.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch investments");
      return api.investments.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateInvestment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateInvestmentRequest) => {
      const payload = {
        ...data,
        investedAmount: Number(data.investedAmount),
        currentValue: Number(data.currentValue),
      };
      
      const res = await fetch(api.investments.create.path, {
        method: api.investments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.investments.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create investment");
      }
      return api.investments.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.investments.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.summary.get.path] });
    },
  });
}

export function useUpdateInvestment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & UpdateInvestmentRequest) => {
      const payload = {
        ...updates,
        investedAmount: updates.investedAmount ? Number(updates.investedAmount) : undefined,
        currentValue: updates.currentValue ? Number(updates.currentValue) : undefined,
      };

      const url = buildUrl(api.investments.update.path, { id });
      const res = await fetch(url, {
        method: api.investments.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to update investment");
      return api.investments.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.investments.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.summary.get.path] });
    },
  });
}

export function useDeleteInvestment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.investments.delete.path, { id });
      const res = await fetch(url, {
        method: api.investments.delete.method,
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to delete investment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.investments.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.summary.get.path] });
    },
  });
}
