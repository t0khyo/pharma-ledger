import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { CreateTransactionInput, PaymentMethod } from "src/shared/types/transaction.types";
import type { Customer } from "src/shared/types/customer.types";
import { format } from "date-fns";
import { formatCurrency } from "@/utils/formatters";


interface AddPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultCustomerId?: string;
  defaultAmount?: number;
  defaultNotes?: string;
}

export function AddPaymentDialog({ 
    open, 
    onOpenChange, 
    onSuccess,
    defaultCustomerId,
    defaultAmount,
    defaultNotes
}: AddPaymentDialogProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState("");
  const [openCombobox, setOpenCombobox] = useState(false);

  // Initialize with defaults when dialog opens
  useEffect(() => {
    if (open) {
        if (defaultCustomerId) setSelectedCustomer(defaultCustomerId);
        if (defaultAmount) setAmount(defaultAmount.toString());
        if (defaultNotes) setNotes(defaultNotes);
    } else {
        // Reset when closed (optional, but good for cleaning up if not handled by parent)
        if (!defaultCustomerId) setSelectedCustomer("");
        if (!defaultAmount) setAmount("");
        if (!defaultNotes) setNotes("");
    }
  }, [open, defaultCustomerId, defaultAmount, defaultNotes]);

  // Fetch customers
  useEffect(() => {
    if (open) {
      loadCustomers();
    }
  }, [open]);

  const loadCustomers = async () => {
    try {
      const result = await window.api.customers.getAll();
      if (result.success && result.data) {
        setCustomers(result.data);
      }
    } catch (error) {
      console.error("Failed to load customers", error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      toast.error("يرجى اختيار العميل");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح");
      return;
    }

    setLoading(true);
    try {
      const input: CreateTransactionInput = {
        customer_id: parseInt(selectedCustomer),
        type: "payment",
        amount: parseFloat(amount),
        date: new Date().toISOString(),
        payment_method: paymentMethod,
        notes: notes,
      };

      const result = await window.api.transactions.add(input);
      if (result.success) {
        toast.success("تم تسجيل التسديد بنجاح");
        onSuccess();
        onOpenChange(false);
        // Reset form
        setSelectedCustomer("");
        setAmount("");
        setPaymentMethod("cash");
        setNotes("");
      } else {
        toast.error(result.error || "فشل تسجيل التسديد");
      }
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء تسجيل التسديد");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>تسجيل تسديد جديد</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="space-y-2">
            <Label>العميل</Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="w-full justify-between"
                >
                  {selectedCustomer
                    ? customers.find((customer) => customer.id.toString() === selectedCustomer)?.name
                    : "اختر العميل..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                    <CommandInput placeholder="بحث عن عميل..." />
                    <CommandList>
                        <CommandEmpty>لم يتم العثور على عميل.</CommandEmpty>
                        <CommandGroup>
                        {customers.map((customer) => (
                            <CommandItem
                            key={customer.id}
                            value={customer.name}
                            onSelect={() => {
                                setSelectedCustomer(customer.id.toString());
                                setOpenCombobox(false);
                            }}
                            >
                            <Check
                                className={cn(
                                "mr-2 h-4 w-4",
                                selectedCustomer === customer.id.toString() ? "opacity-100" : "opacity-0"
                                )}
                            />
                            {customer.name} {customer.phone ? `(${customer.phone})` : ""}
                            </CommandItem>
                        ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            
            {/* Show Balance and Full Payment Button */}
            {selectedCustomer && (() => {
                const customer = customers.find(c => c.id.toString() === selectedCustomer);
                if (!customer || customer.balance === undefined) return null;
                
                const balance = customer.balance;
                let colorClass = "text-green-600 font-bold";
                if (balance < 0) colorClass = "text-red-600 font-bold";
                else if (balance > 0) colorClass = "text-yellow-600 font-bold";
                const isDebt = balance < 0;
                
                return (
                    <div className="flex items-center justify-between text-sm px-1">
                        <div className="flex gap-2 text-muted-foreground">
                            <span>الرصيد الحالي:</span>
                            <span className={colorClass}>
                                {formatCurrency(customer.balance)}
                            </span>
                        </div>
                        
                        {isDebt && (
                             <Button 
                                type="button" 
                                variant="default" // Using default which is usually primary, but overriding with className for specific blue
                                size="sm" 
                                className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => {
                                    setAmount(Math.abs(customer.balance!).toString());
                                    setNotes(`تسديد كامل للمديونية حتى تاريخ ${format(new Date(), "dd/MM/yyyy")}`);
                                }}
                            >
                                سداد كامل الدين
                            </Button>
                        )}
                    </div>
                );
            })()}
          </div>

          <div className="space-y-2">
            <Label>المبلغ المسدد</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
             {/* Remaining Balance Preview */}
             {selectedCustomer && (() => {
                const customer = customers.find(c => c.id.toString() === selectedCustomer);
                if (!customer || customer.balance === undefined) return null;

                const currentBalance = customer.balance;
                const payAmount = parseFloat(amount) || 0;
                // Payment adds to the balance (reduces debt)
                const remainingBalance = currentBalance + payAmount;
                
                let colorClass = "text-green-600 font-bold";
                if (remainingBalance < 0) colorClass = "text-red-600 font-bold";
                else if (remainingBalance > 0) colorClass = "text-yellow-600 font-bold";

                return (
                    <div className="text-xs text-muted-foreground px-1 flex gap-1">
                        <span>الرصيد بعد السداد:</span>
                        <span className={colorClass}>
                             {formatCurrency(remainingBalance)}
                        </span>
                    </div>
                );
            })()}
          </div>

          <div className="space-y-2">
            <Label>طريقة الدفع</Label>
            <Select value={paymentMethod} onValueChange={(v: PaymentMethod) => setPaymentMethod(v)}>
              <SelectTrigger>
                <SelectValue placeholder="طريقة الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">نقدي (Cash)</SelectItem>
                <SelectItem value="e-wallet">محفظة إلكترونية</SelectItem>
                <SelectItem value="instapay">انستا باي</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>ملاحظات (اختياري)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي ملاحظات إضافية..."
            />
          </div>
        </div>
        <DialogFooter>
             <div className="flex w-full gap-2">
                 <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                    إلغاء
                </Button>
                <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
                    {loading ? "جاري الحفظ..." : "تسجيل التسديد"}
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
