import { useInvestments, useCreateInvestment, useUpdateInvestment, useDeleteInvestment } from "@/hooks/use-finance-data";
import { useState } from "react";
import { Plus, Trash2, TrendingUp, Edit2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { insertInvestmentSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const formSchema = insertInvestmentSchema.extend({
  investedAmount: z.coerce.number().min(0),
  currentValue: z.coerce.number().min(0),
});

type FormValues = z.infer<typeof formSchema>;

export default function Investments() {
  const { data: investments, isLoading } = useInvestments();
  const createInvestment = useCreateInvestment();
  const updateInvestment = useUpdateInvestment();
  const deleteInvestment = useDeleteInvestment();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", investedAmount: undefined, currentValue: undefined },
  });

  // Separate form handling for updates could be better, but reusing logical flow for brevity
  const editForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  async function onCreate(data: FormValues) {
    try {
      await createInvestment.mutateAsync(data);
      toast({ title: "Success", description: "Investment added" });
      setIsCreateOpen(false);
      form.reset();
    } catch {
      toast({ title: "Error", description: "Failed to add investment", variant: "destructive" });
    }
  }

  async function onUpdate(data: FormValues) {
    if (!editingId) return;
    try {
      await updateInvestment.mutateAsync({ id: editingId, ...data });
      toast({ title: "Success", description: "Investment updated" });
      setEditingId(null);
    } catch {
      toast({ title: "Error", description: "Failed to update investment", variant: "destructive" });
    }
  }

  const openEdit = (inv: any) => {
    editForm.reset({
      name: inv.name,
      investedAmount: Number(inv.investedAmount),
      currentValue: Number(inv.currentValue),
    });
    setEditingId(inv.id);
  };

  const calculateROI = (invested: number, current: number) => {
    if (invested === 0) return 0;
    return ((current - invested) / invested) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Investment Portfolio</h1>
          <p className="text-muted-foreground mt-1">Watch your wealth grow.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-primary shadow-lg shadow-primary/25">
              <Plus className="mr-2 h-4 w-4" />
              Add Investment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Investment</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onCreate)} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Asset Name</Label>
                <Input placeholder="Stocks, Crypto, ETF..." {...form.register("name")} />
              </div>
              <div className="space-y-2">
                <Label>Invested Amount (PLN)</Label>
                <Input type="number" step="0.01" {...form.register("investedAmount")} />
              </div>
              <div className="space-y-2">
                <Label>Current Value (PLN)</Label>
                <Input type="number" step="0.01" {...form.register("currentValue")} />
              </div>
              <Button type="submit" className="w-full" disabled={createInvestment.isPending}>
                Add Investment
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p>Loading...</p>
        ) : investments && investments.length > 0 ? (
          investments.map((inv) => {
            const roi = calculateROI(Number(inv.investedAmount), Number(inv.currentValue));
            const isPositive = roi >= 0;

            return (
              <div key={inv.id} className="bg-white p-6 rounded-3xl border shadow-sm hover:shadow-lg transition-all duration-300 group">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                    <BarChart3 size={24} />
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(inv)}>
                      <Edit2 size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => setDeleteId(inv.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>

                <h3 className="font-bold text-xl mb-4">{inv.name}</h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-muted-foreground">Current Value</span>
                    <span className="font-bold text-lg">{Number(inv.currentValue).toFixed(2)} PLN</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Invested</span>
                      <span className="font-medium">{Number(inv.investedAmount).toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground block mb-1">ROI</span>
                      <span className={cn(
                        "font-bold inline-flex items-center",
                        isPositive ? "text-emerald-600" : "text-red-600"
                      )}>
                        {isPositive ? <TrendingUp size={14} className="mr-1" /> : <TrendingUp size={14} className="mr-1 rotate-180" />}
                        {roi.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-gray-300">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Empty Portfolio</h3>
            <p className="text-muted-foreground">Start adding your investments to track ROI.</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Investment</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onUpdate)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Asset Name</Label>
              <Input {...editForm.register("name")} />
            </div>
            <div className="space-y-2">
              <Label>Invested Amount</Label>
              <Input type="number" step="0.01" {...editForm.register("investedAmount")} />
            </div>
            <div className="space-y-2">
              <Label>Current Value</Label>
              <Input type="number" step="0.01" {...editForm.register("currentValue")} />
            </div>
            <Button type="submit" className="w-full" disabled={updateInvestment.isPending}>
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Investment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the asset from your portfolio tracking.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                if(deleteId) {
                  await deleteInvestment.mutateAsync(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
