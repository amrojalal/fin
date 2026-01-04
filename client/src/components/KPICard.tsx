import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  amount: number;
  icon: LucideIcon;
  variant?: "default" | "success" | "danger" | "warning";
  className?: string;
  delay?: number;
}

export function KPICard({ title, amount, icon: Icon, variant = "default", className, delay = 0 }: KPICardProps) {
  const variantStyles = {
    default: "bg-white text-gray-900 border-gray-100",
    success: "bg-emerald-50 text-emerald-900 border-emerald-100",
    danger: "bg-red-50 text-red-900 border-red-100",
    warning: "bg-amber-50 text-amber-900 border-amber-100",
  };

  const iconStyles = {
    default: "bg-primary/10 text-primary",
    success: "bg-emerald-100 text-emerald-600",
    danger: "bg-red-100 text-red-600",
    warning: "bg-amber-100 text-amber-600",
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pl-PL', { 
      style: 'currency', 
      currency: 'PLN' 
    }).format(val);
  };

  return (
    <div 
      className={cn(
        "rounded-2xl p-6 border shadow-sm transition-all duration-300 hover:shadow-md animate-in",
        variantStyles[variant],
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-80 mb-1">{title}</p>
          <h3 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
            {formatCurrency(amount)}
          </h3>
        </div>
        <div className={cn("p-3 rounded-xl", iconStyles[variant])}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}
