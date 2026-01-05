import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IconArrowUpRight,
  IconArrowDownLeft,
  IconWallet,
  IconArrowLeft,
  IconUser,
  IconPhone,
  IconFileText,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import type { Customer } from "src/shared/types/customer.types";
import type { Transaction, TransactionStats } from "src/shared/types/transaction.types";

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats>({
    totalDebts: 0,
    totalPayments: 0,
    netBalance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const customerId = parseInt(id);
      
      // We can reuse the getAll customers query and filter or add a getById to service.
      // For now, let's just get all customers and find the one we need (not optimal but works if no getById exposed yet)
      // Actually, since we updated getAll to include balance, we can check if there's a specific API. 
      // If not, we can rely on transaction stats for this customer.
      
      // Let's refetch everything for this customer ID specific context
      const customersResult = await window.api.customers.getAll();
      const foundCustomer = customersResult.data?.find((c: Customer) => c.id === customerId);

      if (foundCustomer) {
        setCustomer(foundCustomer);
      } else {
        toast.error("العميل غير موجود");
        navigate("/customers");
        return;
      }

      // Load transactions and stats for this customer
      const [transactionsResult, statsResult] = await Promise.all([
        window.api.transactions.getAll({ customerId }),
        window.api.transactions.getStats({ customerId }),
      ]);

      if (transactionsResult.success && transactionsResult.data) {
        setTransactions(transactionsResult.data);
      }
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }

    } catch (error) {
      console.error("Failed to load customer data", error);
      toast.error("فشل تحميل بيانات العميل");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-EG", {
      style: "currency",
      currency: "EGP",
    }).format(amount);
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>;
  }

  if (!customer) {
    return <div className="p-8 text-center text-muted-foreground">العميل غير موجود</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/customers")}>
          <IconArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <IconUser className="h-6 w-6" />
            {customer.name}
          </h1>
          {customer.phone && (
            <p className="text-muted-foreground flex items-center gap-1 mt-1 font-mono dir-ltr">
              <IconPhone className="h-4 w-4" />
              {customer.phone}
            </p>
          )}
        </div>
      </div>

       {/* Stats Cards */}
       <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الديون</CardTitle>
            <IconArrowUpRight className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.totalDebts)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التسديدات</CardTitle>
            <IconArrowDownLeft className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalPayments)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صافي الرصيد</CardTitle>
            <IconWallet className={`h-4 w-4 ${stats.netBalance < 0 ? "text-red-500" : stats.netBalance > 0 ? "text-yellow-500" : "text-green-500"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.netBalance < 0 ? "text-red-600" : stats.netBalance > 0 ? "text-yellow-600" : "text-green-600"}`}>
              {formatCurrency(stats.netBalance)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
            <IconFileText className="h-5 w-5" />
            سجل العمليات
        </h2>
        <div className="rounded-md border bg-card">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="text-center">رقم العملية</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-right">التفاصيل / المنتجات</TableHead>
                <TableHead className="text-right">ملاحظات</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transactions.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    لا توجد عمليات مسجلة لهذا العميل
                    </TableCell>
                </TableRow>
                ) : (
                transactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-center">{transaction.id}</TableCell>
                    <TableCell>
                        {format(new Date(transaction.date), "dd/MM/yyyy hh:mm a", { locale: ar })}
                    </TableCell>
                    <TableCell>
                        <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.type === "payment"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                        >
                        {transaction.type === "payment" ? "تسديد" : "دين"}
                        </span>
                    </TableCell>
                    <TableCell className="font-bold">
                        {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                         {transaction.type === 'debt' && transaction.items && transaction.items.length > 0 
                            ? transaction.items.map(i => i.product_name).join(", ") 
                            : (transaction.payment_method === 'cash' ? 'نقدي' : transaction.payment_method === 'instapay' ? 'InstaPay' : 'محفظة')
                         }
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-muted-foreground">
                        {transaction.notes || "-"}
                    </TableCell>
                    </TableRow>
                ))
                )}
            </TableBody>
            </Table>
        </div>
      </div>
    </div>
  );
}
