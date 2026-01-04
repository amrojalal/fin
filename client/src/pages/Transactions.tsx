import { useTransactions, useDeleteTransaction } from "@/hooks/use-transactions";
import { useState } from "react";
import { format } from "date-fns";
import { 
  Trash2, 
  Search, 
  Filter, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  CreditCard,
  MoreVertical 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

export default function Transactions() {
  const [filterType, setFilterType] = useState<'income' | 'expense' | 'debt_payment' | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: transactions, isLoading } = useTransactions({ type: filterType });
  const deleteTransaction = useDeleteTransaction();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filteredTransactions = transactions?.filter(tx => 
    tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tx.notes && tx.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDelete = async () => {
    if (deleteId) {
      await deleteTransaction.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Transactions</h1>
          <p className="text-muted-foreground mt-1">Manage your financial history.</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by category or notes..." 
            className="pl-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button 
            variant={filterType === undefined ? "default" : "outline"}
            onClick={() => setFilterType(undefined)}
            className="rounded-xl flex-1 md:flex-none"
          >
            All
          </Button>
          <Button 
            variant={filterType === 'income' ? "default" : "outline"}
            onClick={() => setFilterType('income')}
            className="rounded-xl flex-1 md:flex-none"
          >
            Income
          </Button>
          <Button 
            variant={filterType === 'expense' ? "default" : "outline"}
            onClick={() => setFilterType('expense')}
            className="rounded-xl flex-1 md:flex-none"
          >
            Expense
          </Button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading transactions...</div>
        ) : filteredTransactions && filteredTransactions.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    tx.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 
                    tx.type === 'expense' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {tx.type === 'income' ? <ArrowUpCircle size={24} /> : 
                     tx.type === 'expense' ? <ArrowDownCircle size={24} /> : <CreditCard size={24} />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{tx.category}</h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      {format(new Date(tx.date), 'dd MMM yyyy')}
                      {tx.notes && <span className="hidden md:inline text-gray-300">• {tx.notes}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`font-bold text-lg ${
                    tx.type === 'income' ? 'text-emerald-600' : 'text-gray-900'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'} {Number(tx.amount).toFixed(2)}
                  </span>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600"
                        onClick={() => setDeleteId(tx.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No transactions found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or add a new transaction.</p>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the transaction from your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
