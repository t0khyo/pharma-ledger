import { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, User, Phone, FileText, MoreVertical, Eye, ArrowUp, ArrowDown, ArrowUpDown, Users, Wallet, TrendingUp, TrendingDown } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Customer, CustomerInput } from "../../shared/types/customer.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/utils/formatters";

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerInput>({ name: "", phone: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [lateOnly, setLateOnly] = useState(false);
  const [lateDays, setLateDays] = useState(21);

  useEffect(() => {
    loadCustomers();
  }, [search, sortBy, sortOrder, lateOnly, lateDays]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const result = await window.api.customers.getAll({ search, sortBy, sortOrder, lateOnly, lateDays });
      if (result.success && result.data) {
        setCustomers(result.data);
      } else {
        toast.error("فشل في تحميل قائمة العملاء");
      }
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        phone: customer.phone || "",
        notes: customer.notes || "",
      });
    } else {
      setEditingCustomer(null);
      setFormData({ name: "", phone: "", notes: "" });
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا العميل؟")) return;

    try {
      const result = await window.api.customers.delete(id);
      if (result.success) {
        toast.success("تم حذف العميل بنجاح");
        loadCustomers();
      } else {
        toast.error("فشل في حذف العميل");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء الحذف");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("آسم العميل مطلوب");
      return;
    }

    setSaving(true);
    try {
      let result;
      if (editingCustomer) {
        result = await window.api.customers.update(editingCustomer.id, formData);
      } else {
        result = await window.api.customers.add(formData);
      }

      if (result.success) {
        toast.success(editingCustomer ? "تم تحديث بيانات العميل" : "تم إضافة العميل بنجاح");
        setIsDialogOpen(false);
        loadCustomers();
      } else {
        // Show specific error from backend if available
        toast.error(result.error ? `فشل في حفظ البيانات: ${result.error}` : "فشل في حفظ البيانات");
      }
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(column);
      setSortOrder("ASC"); // Default to ASC when switching columns
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ArrowUpDown className="w-3 h-3 text-muted-foreground/50 ml-1" />;
    return sortOrder === "ASC" 
      ? <ArrowUp className="w-3 h-3 text-primary ml-1" />
      : <ArrowDown className="w-3 h-3 text-primary ml-1" />;
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">العملاء</h1>
          <p className="text-muted-foreground mt-2">إدارة بيانات العملاء وتفاصيل التواصل</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة عميل
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العملاء</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {customers.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الديون</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(customers.reduce((sum, c) => sum + Math.max(0, -(c.balance || 0)), 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأرصدة</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(customers.reduce((sum, c) => sum + Math.max(0, c.balance || 0), 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صافي الرصيد</CardTitle>
            <Wallet className={`h-4 w-4 ${customers.reduce((sum, c) => sum + (c.balance || 0), 0) < 0 ? "text-red-500" : customers.reduce((sum, c) => sum + (c.balance || 0), 0) > 0 ? "text-green-500" : "text-green-500"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${customers.reduce((sum, c) => sum + (c.balance || 0), 0) < 0 ? "text-red-600" : "text-green-600"}`}>
              {customers.reduce((sum, c) => sum + (c.balance || 0), 0) > 0
                ? `- ${formatCurrency(customers.reduce((sum, c) => sum + (c.balance || 0), 0))}`
                : formatCurrency(Math.abs(customers.reduce((sum, c) => sum + (c.balance || 0), 0)))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-lg border shadow-sm flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="بحث باسم العميل أو رقم الهاتف..." 
            className="pr-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        {/* Late Debts Filter */}
        <div className="flex items-center gap-3 p-2 rounded-lg border bg-muted/30">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={lateOnly}
              onChange={(e) => setLateOnly(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium">ديون متأخرة فقط</span>
          </label>
          {lateOnly && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">أكثر من</span>
              <Input
                type="number"
                min={1}
                value={lateDays}
                onChange={(e) => setLateDays(Math.max(1, parseInt(e.target.value) || 21))}
                className="w-16 h-8 text-center"
              />
              <span className="text-sm text-muted-foreground">يوم</span>
            </div>
          )}
        </div>
      </div>

      <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  اسم العميل
                  <SortIcon column="name" />
                </div>
              </TableHead>
              <TableHead>رقم الهاتف</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('balance')}
              >
                <div className="flex items-center">
                  الرصيد
                  <SortIcon column="balance" />
                </div>
              </TableHead>
              <TableHead>ملاحظات</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  {loading ? "جاري التحميل..." : "لا يوجد عملاء"}
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer, index) => (
                <TableRow 
                  key={customer.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/customers/${customer.id}`)}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="w-4 h-4" />
                      </div>
                      {customer.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.phone ? (
                      <div className="flex items-center gap-2 dir-ltr text-right">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        <span className="font-mono text-sm">{customer.phone}</span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "font-bold",
                      (customer.balance || 0) < 0 ? "text-red-600" : 
                      (customer.balance || 0) > 0 ? "text-green-600" : "text-green-600"
                    )}>
                      {(customer.balance || 0) < 0 
                        ? formatCurrency(Math.abs(customer.balance || 0))
                        : (customer.balance || 0) > 0
                        ? `- ${formatCurrency(customer.balance || 0)}`
                        : formatCurrency(0)
                      }
                    </span>
                  </TableCell>
                  <TableCell>
                     {customer.notes ? (
                      <div className="flex items-center gap-2 max-w-[200px] truncate" title={customer.notes}>
                        <FileText className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground truncate">{customer.notes}</span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/customers/${customer.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          عرض التفاصيل
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenDialog(customer)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(customer.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? "تعديل بيانات عميل" : "إضافة عميل جديد"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>اسم العميل *</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="أدخل اسم العميل"
              />
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="01xxxxxxxxx"
                className="font-mono direction-ltr text-right"
              />
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="أي ملاحظات إضافية..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}