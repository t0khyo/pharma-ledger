import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { CreateTransactionInput } from "src/shared/types/transaction.types";
import type { Customer } from "src/shared/types/customer.types";

interface AddDebtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddDebtDialog({ open, onOpenChange, onSuccess }: AddDebtDialogProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [products, setProducts] = useState<{ name: string; id: number }[]>([{ name: "", id: 1 }]);

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

  const addProduct = () => {
    setProducts([...products, { name: "", id: Date.now() }]);
  };

  const removeProduct = (id: number) => {
    if (products.length > 1) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  const updateProduct = (id: number, name: string) => {
    setProducts(products.map((p) => (p.id === id ? { ...p, name } : p)));
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
      // Filter out empty products
      const validProducts = products.filter(p => p.name.trim() !== "");
      
      const input: CreateTransactionInput = {
        customer_id: parseInt(selectedCustomer),
        type: "debt",
        amount: parseFloat(amount),
        date: new Date().toISOString(),
        notes: notes,
        items: validProducts.map(p => ({ product_name: p.name })),
      };

      const result = await window.api.transactions.add(input);
      if (result.success) {
        toast.success("تم إضافة الدين بنجاح");
        onSuccess();
        onOpenChange(false);
        // Reset form
        setSelectedCustomer("");
        setAmount("");
        setNotes("");
        setProducts([{ name: "", id: 1 }]);
      } else {
        toast.error(result.error || "فشل إضافة الدين");
      }
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء إضافة الدين");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>إضافة دين جديد</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>العميل</Label>
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger>
                <SelectValue placeholder="اختر العميل" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name} {customer.phone ? `(${customer.phone})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>المنتجات</Label>
            {products.map((product, index) => (
              <div key={product.id} className="flex gap-2">
                <Input
                  placeholder={`منتج ${index + 1}`}
                  value={product.name}
                  onChange={(e) => updateProduct(product.id, e.target.value)}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeProduct(product.id)}
                  disabled={products.length === 1}
                  type="button"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 w-full border-dashed"
              onClick={addProduct}
            >
              <Plus className="mr-2 h-4 w-4" /> إضافة منتج آخر
            </Button>
          </div>

          <div className="space-y-2">
            <Label>المبلغ الكلي</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
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
                    {loading ? "جاري الإضافة..." : "حفظ"}
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
