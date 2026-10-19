import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Transaction } from "src/shared/types/transaction.types";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import { ArrowDownLeft, ArrowUpRight, Wallet, Banknote, Landmark, Building2 } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { useSensitive } from "@/contexts/SensitiveContext";

interface ActivityTimelineProps {
  transactions: Transaction[];
  loading?: boolean;
}

export function ActivityTimeline({ transactions, loading }: ActivityTimelineProps) {
  const { showSensitive } = useSensitive();

  if (loading) {
    return (
      <Card className="border-border/50 h-[350px] flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">جاري تحميل النشاطات...</div>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card className="border-border/50 h-[350px] flex items-center justify-center">
        <div className="text-muted-foreground">لا توجد نشاطات مسجلة</div>
      </Card>
    );
  }

  const getMethodIcon = (method?: string) => {
    switch (method) {
      case "cash": return <Banknote className="h-3 w-3" />;
      case "instapay": return <Building2 className="h-3 w-3" />;
      case "bank_transfer": return <Landmark className="h-3 w-3" />;
      case "e-wallet":
      default: return <Wallet className="h-3 w-3" />;
    }
  };

  const getMethodLabel = (method?: string) => {
    switch (method) {
      case "cash": return "كاش";
      case "instapay": return "انستاباي";
      case "bank_transfer": return "تحويل بنكي";
      case "e-wallet": return "محفظة إلكترونية";
      default: return "غير محدد";
    }
  };

  return (
    <Card className="border-border/50 h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">أحدث النشاطات</CardTitle>
        <CardDescription className="text-xs">آخر المعاملات المالية المسجلة</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-auto pl-1 pr-6 pb-2">
        <div className="space-y-1.5 h-full">
          {transactions.map((tx, idx) => {
            const isPayment = tx.type === 'payment';
            const timeAgo = formatDistanceToNow(parseISO(tx.created_at || tx.date), { addSuffix: true, locale: ar });

            return (
              <div
                key={tx.id || idx}
                className="flex items-start gap-2.5 p-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className={`p-1 rounded-md ${isPayment ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  {isPayment ? (
                    <ArrowDownLeft className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-red-500" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{tx.customer_name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <span className="font-medium text-foreground">
                      {isPayment ? 'تسديد' : 'دين'}
                    </span>
                    {tx.notes && (
                      <span className="line-clamp-1 border-r border-border pr-1 mr-1">
                        {tx.notes}
                      </span>
                    )}
                  </div>
                  {tx.payment_method && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                      {getMethodIcon(tx.payment_method)}
                      {getMethodLabel(tx.payment_method)}
                    </div>
                  )}
                </div>
                
                <div className="text-left flex flex-col items-end">
                  <p className={`text-xs font-bold ${isPayment ? 'text-green-500' : 'text-red-500'}`}>
                    {showSensitive ? formatCurrency(tx.amount) : '******'}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5" dir="rtl">
                    {timeAgo}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
