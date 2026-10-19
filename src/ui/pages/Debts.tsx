import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Plus,
  Search,
  Trash2,
  Eye,
  MoreVertical,
  Info,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Scale,
} from "lucide-react";
import { toast } from "sonner";
import { AddDebtDialog } from "@/components/debts/AddDebtDialog";
import { AddPaymentDialog } from "@/components/debts/AddPaymentDialog";
import type { Transaction, TransactionFilters } from "src/shared/types/transaction.types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Label } from "@radix-ui/react-dropdown-menu";
import { formatCurrency } from "@/utils/formatters";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSensitive } from "@/contexts/SensitiveContext";

export default function Debts() {
  const [filters] = useState<TransactionFilters>({});
  const [searchQuery, setSearchQuery] = useState("");
  const { showSensitive } = useSensitive();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  // Dialog states
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);


  const { data, refetch: loadData } = useQuery({
    queryKey: ['transactions', { filters, currentPage }],
    queryFn: async () => {
      const [transactionsResult, statsResult] = await Promise.all([
        window.api.transactions.getAll({ ...filters, limit: itemsPerPage, offset: (currentPage - 1) * itemsPerPage }),
        window.api.transactions.getStats({}),
      ]);
      return {
        transactions: transactionsResult.data || [],
        totalTransactions: transactionsResult.total || 0,
        stats: statsResult.data || {
          totalDebts: 0,
          totalPayments: 0,
          unpaidDebts: 0,
          netBalance: 0,
        }
      };
    }
  });

  const transactions = data?.transactions || [];
  const totalTransactions = data?.totalTransactions || 0;
  const stats = data?.stats || { totalDebts: 0, totalPayments: 0, unpaidDebts: 0, netBalance: 0 };
  const totalPages = Math.ceil(totalTransactions / itemsPerPage);
  


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



  return (
    <div className="space-y-6">
      {/* Header with Hide Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">سجل الديون</h1>
          <p className="text-muted-foreground">إدارة ديون وتسديدات العملاء</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الديون</CardTitle>
            <CreditCard className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {showSensitive ? (
                formatCurrency(stats.totalDebts)
              ) : (
                <span className="blur-md select-none bg-muted/50 rounded px-2">
                  ******
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التسديدات</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {showSensitive ? (
                formatCurrency(stats.totalPayments)
              ) : (
                <span className="blur-md select-none bg-muted/50 rounded px-2">
                  ******
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-1 text-sm font-medium">
              صافي الرصيد
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    aria-label="شرح صافي الرصيد"
                    className="h-5 w-5 text-muted-foreground hover:text-foreground"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" align="start">
                  صافي الرصيد = إجمالي التسديدات - إجمالي الديون. الأخضر مع علامة (-) يعني رصيداً لصالح العملاء، والأحمر بدون علامة يعني ديناً مستحقاً.
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <Scale className={`h-4 w-4 ${stats.netBalance < 0 ? "text-rose-500" : "text-emerald-500"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {showSensitive ? (
                stats.netBalance > 0 ? `- ${formatCurrency(stats.netBalance)}` : formatCurrency(Math.abs(stats.netBalance))
              ) : (
                <span className="blur-md select-none bg-muted/50 rounded px-2">
                  ******
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Unpaid Debts Card */}
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الديون غير المسددة</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {showSensitive ? (
                formatCurrency(stats.unpaidDebts)
              ) : (
                <span className="blur-md select-none bg-muted/50 rounded px-2">
                  ******
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions & Filters */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث باسم العميل..."
            className="pr-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => setShowAddPayment(true)} variant="default" className="flex-1 sm:flex-none">
            <Plus className="ml-2 h-4 w-4" />
            تسجيل تسديد
          </Button>
          <Button onClick={() => setShowAddDebt(true)} variant="default" className="flex-1 sm:flex-none">
            <Plus className="ml-2 h-4 w-4" />
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
              <TableHead className="text-right">التفاصيل</TableHead>
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
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        transaction.type === "payment"
                          ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-400 dark:border-green-500/25"
                          : "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25"
                      }`}
                    >
                      {transaction.type === "payment" ? "تسديد" : "دين"}
                    </span>
                  </TableCell>
                  <TableCell className="font-bold">
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                     {transaction.type === 'debt' 
                        ? (transaction.items && transaction.items.length > 0 
                            ? transaction.items.map(i => i.product_name).join(", ") 
                            : "-")
                        : (transaction.payment_method 
                            ? (transaction.payment_method === 'cash' ? 'نقدي' 
                               : transaction.payment_method === 'instapay' ? 'انستا باي' 
                               : transaction.payment_method === 'e-wallet' ? 'محفظة إلكترونية' 
                               : 'تحويل بنكي')
                            : "-")
                     }
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate text-muted-foreground">
                    {transaction.notes || "-"}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUneditableView(transaction)}>
                          <Eye className="ml-2 h-4 w-4" />
                          عرض التفاصيل
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(transaction.id)}
                        >
                          <Trash2 className="ml-2 h-4 w-4" />
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-muted-foreground">
            عرض {(currentPage - 1) * itemsPerPage + 1} إلى {Math.min(currentPage * itemsPerPage, totalTransactions)} من أصل {totalTransactions} عملية
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              السابق
            </Button>
            <div className="text-sm font-medium">
              صفحة {currentPage} من {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              التالي
            </Button>
          </div>
        </div>
      )}

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
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>تفاصيل العملية #{selectedTransaction?.id}</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-1">
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
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                selectedTransaction.type === "payment"
                                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-400 dark:border-green-500/25"
                                : "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25"
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
                                 selectedTransaction.payment_method === 'instapay' ? 'انستا باي' : 
                                 selectedTransaction.payment_method === 'e-wallet' ? 'محفظة إلكترونية' : 'تحويل بنكي'}
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
          </div>

          <DialogFooter>
             <Button variant="destructive" onClick={() => selectedTransaction && handleDelete(selectedTransaction.id)}>
                <Trash2 className="ml-2 h-4 w-4" />
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





