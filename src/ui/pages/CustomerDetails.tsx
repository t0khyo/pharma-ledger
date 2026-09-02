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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  IconArrowUpRight,
  IconArrowDownLeft,
  IconWallet,
  IconArrowLeft,
  IconUser,
  IconPhone,
  IconFileText,
  IconPrinter,
  IconCheck,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import type { Customer } from "src/shared/types/customer.types";
import type { Transaction, TransactionStats } from "src/shared/types/transaction.types";
import { AddPaymentDialog } from "@/components/debts/AddPaymentDialog";
import { formatCurrency } from "@/utils/formatters";
import logoImage from "@/assets/logo.png";

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats>({
    totalDebts: 0,
    totalPayments: 0,
    unpaidDebts: 0,
    netBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showFullPayment, setShowFullPayment] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const handleFullPaymentSuccess = () => {
    setShowFullPayment(false);
    loadData();
  };

  const handlePrint = () => {
    setShowPrintPreview(true);
  };

  const handleConfirmPrint = () => {
    setShowPrintPreview(false);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  // Update document title for print filename
  useEffect(() => {
    if (customer) {
        const dateStr = format(new Date(), "yyyy-MM-dd_HH-mm");
        const oldTitle = document.title;
        document.title = `${customer.name}_${dateStr}`;
        return () => {
            document.title = oldTitle;
        };
    }
  }, [customer]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const customerId = parseInt(id);
      
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



  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>;
  }

  if (!customer) {
    return <div className="p-8 text-center text-muted-foreground">العميل غير موجود</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
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
        <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
                <IconPrinter className="w-4 h-4 ml-2" />
                طباعة كشف
            </Button>
            {stats.netBalance < 0 && (
                <Button onClick={() => setShowFullPayment(true)}>
                    <IconCheck className="w-4 h-4 ml-2" />
                    تسديد كامل
                </Button>
            )}
        </div>
      </div>

      {/* Print Header - Visible only in print */}
      <div className="hidden print-header print-only mb-6 pb-4 border-b-2">
        <div className="flex flex-row-reverse justify-between items-start gap-6">
          {/* Right Side: Information */}
          <div className="text-right">
            {/* Title */}
            <h1 className="text-2xl font-bold mb-2">كشف حساب عميل</h1>
            
            {/* Date */}
            <p className="text-sm text-gray-600 mb-3">
              {format(new Date(), "dd/MM/yyyy - hh:mm a", { locale: ar })}
            </p>

            {/* Customer Name */}
            <h2 className="text-xl font-bold mb-1">{customer.name}</h2>
            {customer.phone && (
              <p className="text-sm text-gray-600 mb-4 dir-ltr">
                رقم الهاتف: {customer.phone}
              </p>
            )}

            {/* Statistics Summary */}
            <div className="grid grid-cols-3 gap-3 text-center mt-4 border-t pt-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">إجمالي الديون</p>
                <p className="text-base font-bold text-blue-600">{formatCurrency(stats.totalDebts)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">إجمالي التسديدات</p>
                <p className="text-base font-bold text-green-600">{formatCurrency(stats.totalPayments)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">الديون غير المسددة</p>
                <p className="text-base font-bold text-red-600">{formatCurrency(stats.unpaidDebts)}</p>
              </div>
            </div>
          </div>

          {/* Left Side: Logo */}
          <div className="flex-shrink-0">
            <img 
              src={logoImage} 
              alt="Pharmacy Logo" 
              className="w-32 h-32"
            />
          </div>
        </div>
      </div>

       {/* Stats Cards - Hidden in Print */}
       <div className="grid gap-4 md:grid-cols-3 no-print">
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
            <IconWallet className={`h-4 w-4 ${stats.netBalance < 0 ? "text-red-500" : "text-green-500"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.netBalance < 0 ? "text-red-600" : "text-green-600"}`}>
              {stats.netBalance > 0 ? `- ${formatCurrency(stats.netBalance)}` : formatCurrency(Math.abs(stats.netBalance))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2 no-print">
            <IconFileText className="h-5 w-5" />
            سجل العمليات
        </h2>
        <div className="rounded-md border bg-card">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="text-center w-[60px]">#</TableHead>
                <TableHead className="text-right w-[120px]">التاريخ</TableHead>
                <TableHead className="text-right w-[80px]">النوع</TableHead>
                <TableHead className="text-right w-[100px]">المبلغ</TableHead>
                <TableHead className="text-right">التفاصيل</TableHead>
                <TableHead className="text-right w-[150px]">ملاحظات</TableHead>
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
                    <TableCell className="font-medium text-center text-xs">{transaction.id}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(transaction.date), "dd/MM/yyyy hh:mm a", { locale: ar })}
                    </TableCell>
                    <TableCell>
                        <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            transaction.type === "payment"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                        >
                        {transaction.type === "payment" ? "تسديد" : "دين"}
                        </span>
                    </TableCell>
                    <TableCell className="font-bold text-sm">
                        {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="text-xs whitespace-pre-wrap break-words">
                         {transaction.type === 'debt' && transaction.items && transaction.items.length > 0 
                            ? transaction.items.map(i => i.product_name).join(", ") 
                            : (transaction.payment_method === 'cash' ? 'نقدي' : transaction.payment_method === 'instapay' ? 'InstaPay' : 'محفظة إلكترونية')
                         }
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                        {transaction.notes || "-"}
                    </TableCell>
                    </TableRow>
                ))
                )}
            </TableBody>
            </Table>
        </div>
      </div>
      
      {customer && (
        <AddPaymentDialog 
            open={showFullPayment} 
            onOpenChange={setShowFullPayment}
            onSuccess={handleFullPaymentSuccess}
            defaultCustomerId={customer.id.toString()}
            defaultAmount={Math.abs(stats.netBalance)}
            defaultNotes={`تسديد كامل للمديونية حتى تاريخ ${format(new Date(), "dd/MM/yyyy", { locale: ar })}`}
        />
      )}

      {/* Print Preview Dialog */}
      <Dialog open={showPrintPreview} onOpenChange={setShowPrintPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>معاينة الطباعة</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg p-6 bg-white" dir="rtl">
            {/* Print Header Preview */}
            <div className="mb-6 pb-4 border-b-2">
              <div className="flex flex-row-reverse justify-between items-start gap-6">
                <div className="text-right">
                  <h1 className="text-2xl font-bold mb-2">كشف حساب عميل</h1>
                  <p className="text-sm text-gray-600 mb-3">
                    {format(new Date(), "dd/MM/yyyy - hh:mm a", { locale: ar })}
                  </p>
                  <h2 className="text-xl font-bold mb-1">{customer.name}</h2>
                  {customer.phone && (
                    <p className="text-sm text-gray-600 mb-4 dir-ltr">
                      رقم الهاتف: {customer.phone}
                    </p>
                  )}
                  <div className="grid grid-cols-3 gap-3 text-center mt-4 border-t pt-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">إجمالي الديون</p>
                      <p className="text-base font-bold text-blue-600">{formatCurrency(stats.totalDebts)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">إجمالي التسديدات</p>
                      <p className="text-base font-bold text-green-600">{formatCurrency(stats.totalPayments)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">الديون غير المسددة</p>
                      <p className="text-base font-bold text-red-600">{formatCurrency(stats.unpaidDebts)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <img 
                    src={logoImage} 
                    alt="Pharmacy Logo" 
                    className="w-32 h-32"
                  />
                </div>
              </div>
            </div>

            {/* Transactions Table Preview */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center w-[60px]">#</TableHead>
                    <TableHead className="text-right w-[120px]">التاريخ</TableHead>
                    <TableHead className="text-right w-[80px]">النوع</TableHead>
                    <TableHead className="text-right w-[100px]">المبلغ</TableHead>
                    <TableHead className="text-right">التفاصيل</TableHead>
                    <TableHead className="text-right w-[150px]">ملاحظات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium text-center text-xs">{transaction.id}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(transaction.date), "dd/MM/yyyy hh:mm a", { locale: ar })}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            transaction.type === "payment"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          {transaction.type === "payment" ? "تسديد" : "دين"}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold text-sm">
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell className="text-xs whitespace-pre-wrap break-words">
                        {transaction.type === 'debt' && transaction.items && transaction.items.length > 0 
                          ? transaction.items.map(i => i.product_name).join(", ") 
                          : (transaction.payment_method === 'cash' ? 'نقدي' : transaction.payment_method === 'instapay' ? 'InstaPay' : 'محفظة إلكترونية')
                        }
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                        {transaction.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPrintPreview(false)}>
              إلغاء
            </Button>
            <Button onClick={handleConfirmPrint}>
              <IconPrinter className="w-4 h-4 ml-2" />
              طباعة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
