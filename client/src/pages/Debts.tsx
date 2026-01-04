import { useDebts, useCreateDebt, useDeleteDebt } from "@/hooks/use-finance-data";
import { useState } from "react";
import { Plus, Trash2, CreditCard, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDebtSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const formSchema = insertDebtSchema.extend({
  initialAmount: z.coerce.number().min(0.01, "Amount must be positive"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Debts() {
  const { data: debts, isLoading } = useDebts();
  const createDebt = useCreateDebt();
  const deleteDebt = useDeleteDebt();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      initialAmount: undefined,
    },
  });

  async function onSubmit(data: FormValues) {
    try {
      await createDebt.mutateAsync(data);
      toast({ title: "Debt Added", description: `${data.name} has been added.` });
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to add debt", 
        variant: "destructive" 
      });
    }
  }

  async function handleDelete() {
    if (deleteId) {
      await deleteDebt.mutateAsync(deleteId);
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Debt Management</h1>
          <p className="text-muted-foreground mt-1">Track your journey to being debt-free.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-primary shadow-lg shadow-primary/25">
              <Plus className="mr-2 h-4 w-4" />
              Add Debt
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Debt</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Debt Name</Label>
                <Input id="name" placeholder="Credit Card, Loan, etc." {...form.register("name")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="initialAmount">Total Amount (PLN)</Label>
                <Input id="initialAmount" type="number" step="0.01" placeholder="0.00" {...form.register("initialAmount")} />
              </div>
              <Button type="submit" className="w-full" disabled={createDebt.isPending}>
                {createDebt.isPending ? "Creating..." : "Create Debt"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
          ))
        ) : debts && debts.length > 0 ? (
          debts.map((debt) => (
            <div key={debt.id} className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
                  <CreditCard size={24} />
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-400 hover:text-red-500"
                  onClick={() => setDeleteId(debt.id)}
                >
                  <Trash2 size={18} />
                </Button>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-1">{debt.name}</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-2xl font-bold text-gray-900">
                    {Number(debt.remainingAmount).toFixed(2)} PLN
                  </span>
                  <span className="text-sm text-muted-foreground">remaining</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium text-muted-foreground">
                    <span>Progress</span>
                    <span>{Math.round(debt.progress)}%</span>
                  </div>
                  <Progress value={debt.progress} className="h-2" indicatorClassName="bg-amber-500" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Paid: {Number(debt.paidAmount).toFixed(0)}</span>
                    <span>Total: {Number(debt.initialAmount).toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-gray-300">
            <TrendingDown className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No debts tracked</h3>
            <p className="text-muted-foreground">Great job! Or click "Add Debt" to start tracking.</p>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Debt?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting this debt will remove it from your dashboard, but historical payments will remain in transactions.
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
