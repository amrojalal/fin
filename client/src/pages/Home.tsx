import { useSummary, useTransactions } from "@/hooks/use-finance-data";
import { KPICard } from "@/components/KPICard";
import { 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  CreditCard, 
  Plus, 
  Calendar as CalendarIcon,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TransactionForm } from "@/components/TransactionForm";
import { useState } from "react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTransactions as useRecentTransactions } from "@/hooks/use-transactions";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: summary, isLoading: isSummaryLoading } = useSummary();
  const { data: transactions, isLoading: isTransactionsLoading } = useRecentTransactions({ limit: 5 });
  const [isTxDialogOpen, setIsTxDialogOpen] = useState(false);

  // Quick dummy data for chart if not enough real data exists
  const chartData = [
    { name: 'Income', amount: Number(summary?.totalIncome || 0), color: '#10b981' }, // Emerald-500
    { name: 'Expenses', amount: Number(summary?.totalExpenses || 0), color: '#ef4444' }, // Red-500
  ];

  if (isSummaryLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const netPos = Number(summary?.netPosition || 0);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your financial health.</p>
        </div>
        
        <Dialog open={isTxDialogOpen} onOpenChange={setIsTxDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl px-6 py-6 shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90 text-lg font-semibold transition-all hover:-translate-y-0.5">
              <Plus className="mr-2 h-5 w-5" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Transaction</DialogTitle>
            </DialogHeader>
            <TransactionForm onSuccess={() => setIsTxDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Cash Balance" 
          amount={Number(summary?.cashBalance || 0)} 
          icon={Wallet} 
          variant="default"
          delay={0}
        />
        <KPICard 
          title="Total Income" 
          amount={Number(summary?.totalIncome || 0)} 
          icon={ArrowUpCircle} 
          variant="success"
          delay={100}
        />
        <KPICard 
          title="Total Expenses" 
          amount={Number(summary?.totalExpenses || 0)} 
          icon={ArrowDownCircle} 
          variant="danger"
          delay={200}
        />
        <KPICard 
          title="Remaining Debt" 
          amount={Number(summary?.remainingDebt || 0)} 
          icon={CreditCard} 
          variant="warning"
          delay={300}
        />
      </div>

      {/* Charts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border shadow-sm h-[400px]">
          <h3 className="text-lg font-bold font-display mb-6">Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chartData} layout="vertical" barSize={40}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="amount" radius={[0, 12, 12, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-3xl border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold font-display">Recent Activity</h3>
            <CalendarIcon className="text-gray-400 h-5 w-5" />
          </div>
          
          <div className="space-y-4">
            {isTransactionsLoading ? (
              <Loader2 className="animate-spin mx-auto text-primary" />
            ) : transactions && transactions.length > 0 ? (
              transactions.map((tx, i) => (
                <div 
                  key={tx.id} 
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors animate-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 
                      tx.type === 'expense' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {tx.type === 'income' ? <ArrowUpCircle size={18} /> : 
                       tx.type === 'expense' ? <ArrowDownCircle size={18} /> : <CreditCard size={18} />}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{tx.category}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(tx.date), 'MMM d')}</p>
                    </div>
                  </div>
                  <span className={`font-bold text-sm ${
                    tx.type === 'income' ? 'text-emerald-600' : 'text-gray-900'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'} {Number(tx.amount).toFixed(2)} PLN
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground text-sm py-10">No recent transactions</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
