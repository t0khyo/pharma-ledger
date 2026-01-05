import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconPlus,
  IconSearch,
  IconTrash,
  IconEye,
  IconDotsVertical,
  IconArrowUpRight,
  IconArrowDownLeft,
  IconWallet,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { AddDebtDialog } from "@/components/debts/AddDebtDialog";
import { AddPaymentDialog } from "@/components/debts/AddPaymentDialog";
import type { Transaction, TransactionStats, TransactionFilters } from "src/shared/types/transaction.types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Label } from "@radix-ui/react-dropdown-menu";

export default function Debts() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats>({
    totalDebts: 0,
    totalPayments: 0,
    netBalance: 0,
  });
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [searchQuery, setSearchQuery] = useState("");


  // Dialog states
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, [filters]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, query: searchQuery }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadData = async () => {

    try {
      const [transactionsResult, statsResult] = await Promise.all([
        window.api.transactions.getAll(filters),
        window.api.transactions.getStats(filters),
      ]);

      if (transactionsResult.success && transactionsResult.data) {
        setTransactions(transactionsResult.data);
      }
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error("Failed to load data", error);
      toast.error("فشل تحميل البيانات");
    } finally {

    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه العملية؟")) return;

    try {
      const result = await window.api.transactions.delete(id);
      if (result.success) {
        toast.success("تم حذف العملية بنجاح");
        loadData();
        setShowViewDialog(false);
      } else {
        toast.error("فشل حذف العملية");
      }
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء الحذف");
    }
  };

  const handleUneditableView = (transaction: Transaction) => {
      setSelectedTransaction(transaction);
      setShowViewDialog(true);
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-EG", {
      style: "currency",
      currency: "EGP",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
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

      {/* Actions & Filters */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div className="relative w-full sm:w-72">
          <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث باسم العميل..."
            className="pr-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => setShowAddPayment(true)} variant="default" className="flex-1 sm:flex-none">
            <IconPlus className="ml-2 h-4 w-4" />
            تسجيل تسديد
          </Button>
          <Button onClick={() => setShowAddDebt(true)} variant="default" className="flex-1 sm:flex-none">
            <IconPlus className="ml-2 h-4 w-4" />
            إضافة دين
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">رقم العملية</TableHead>
              <TableHead className="text-right">العميل</TableHead>
              <TableHead className="text-right">التاريخ</TableHead>
              <TableHead className="text-right">النوع</TableHead>
              <TableHead className="text-right">المبلغ</TableHead>
              <TableHead className="text-right">التفاصيل / المنتجات</TableHead>
              <TableHead className="text-right">ملاحظات</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  لا توجد عمليات مسجلة
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow key={transaction.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleUneditableView(transaction)}>
                  <TableCell className="font-medium text-center">{transaction.id}</TableCell>
                  <TableCell>{transaction.customer_name}</TableCell>
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
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <IconDotsVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUneditableView(transaction)}>
                          <IconEye className="ml-2 h-4 w-4" />
                          عرض التفاصيل
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(transaction.id)}
                        >
                          <IconTrash className="ml-2 h-4 w-4" />
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <AddDebtDialog
        open={showAddDebt}
        onOpenChange={setShowAddDebt}
        onSuccess={loadData}
      />
      <AddPaymentDialog
        open={showAddPayment}
        onOpenChange={setShowAddPayment}
        onSuccess={loadData}
      />

       {/* View Transaction Dialog */}
       <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>تفاصيل العملية #{selectedTransaction?.id}</DialogTitle>
          </DialogHeader>
          
          {selectedTransaction && (
             <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="text-muted-foreground">العميل</Label>
                        <div className="font-medium">{selectedTransaction.customer_name}</div>
                    </div>
                    <div>
                        <Label className="text-muted-foreground">التاريخ</Label>
                        <div className="font-medium">
                            {format(new Date(selectedTransaction.date), "dd MMMM yyyy, hh:mm a", { locale: ar })}
                        </div>
                    </div>
                    <div>
                        <Label className="text-muted-foreground">النوع</Label>
                        <div>
                            <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                selectedTransaction.type === "payment"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                            >
                            {selectedTransaction.type === "payment" ? "تسديد" : "دين"}
                            </span>
                        </div>
                    </div>
                    <div>
                        <Label className="text-muted-foreground">المبلغ</Label>
                        <div className="font-bold text-lg">{formatCurrency(selectedTransaction.amount)}</div>
                    </div>
                </div>

                <div className="border-t pt-4">
                     {selectedTransaction.type === 'debt' ? (
                        <>
                            <Label className="mb-2 block">المنتجات</Label>
                            <div className="bg-muted p-3 rounded-md space-y-2">
                                {selectedTransaction.items && selectedTransaction.items.length > 0 ? (
                                    selectedTransaction.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span>{item.product_name}</span>
                                            <span className="text-muted-foreground">x{item.quantity || 1}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-muted-foreground text-sm">لا توجد منتجات مسجلة</div>
                                )}
                            </div>
                        </>
                     ) : (
                        <>
                             <Label className="mb-2 block">طريقة الدفع</Label>
                             <div className="bg-muted p-2 rounded-md text-sm">
                                {selectedTransaction.payment_method === 'cash' ? 'نقدي (Cash)' : 
                                 selectedTransaction.payment_method === 'instapay' ? 'InstaPay' : 'محفظة إلكترونية'}
                             </div>
                        </>
                     )}
                </div>

                {selectedTransaction.notes && (
                    <div className="space-y-1">
                        <Label className="text-muted-foreground">ملاحظات</Label>
                        <p className="text-sm bg-muted/50 p-2 rounded">{selectedTransaction.notes}</p>
                    </div>
                )}
             </div>
          )}

          <DialogFooter>
             <Button variant="destructive" onClick={() => selectedTransaction && handleDelete(selectedTransaction.id)}>
                <IconTrash className="ml-2 h-4 w-4" />
                حذف العملية
             </Button>
             <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                إغلاق
             </Button>
          </DialogFooter>
        </DialogContent>
       </Dialog>

    </div>
  );
}
