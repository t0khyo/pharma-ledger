import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { companyService } from "@/services/company.service";
import type { Company } from "../../shared/types/company.types";
import { CompanyDialog } from "@/components/CompanyDialog";
import { toast } from "sonner";
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
import { DataTable } from "@/components/companies/DataTable";
import { columns } from "@/components/companies/Columns";
import { useAuth } from "@/contexts/AuthContext";

export default function Companies() {
  const { hasRole } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    company: Company | null;
  }>({
    open: false,
    company: null,
  });

  const isAdmin = hasRole("admin");

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const data = await companyService.getAll();
      setCompanies(data);
    } catch {
      toast.error("فشل في تحميل الشركات");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setDialogOpen(true);
  };

  const handleDelete = (company: Company) => {
    setDeleteDialog({ open: true, company });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.company) return;
    const company = deleteDialog.company;
    setDeleteDialog({ open: false, company: null });

    try {
      await companyService.delete(company.company_id);
      setCompanies(
        companies.filter((c) => c.company_id !== company.company_id)
      );
      toast.success("تم حذف الشركة");
    } catch {
      toast.error("فشل في حذف الشركة");
    }
  };

  const tableColumns = isAdmin
    ? columns
    : columns.filter((col) => col.id !== "actions");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الشركات</h1>
          <p className="text-muted-foreground">إدارة شركات الأدوية والموردين</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 ml-2" />
            إضافة شركة جديدة
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : (
        <DataTable
          columns={tableColumns}
          data={companies}
          onEdit={isAdmin ? handleEdit : undefined}
          onDelete={isAdmin ? handleDelete : undefined}
        />
      )}

      <CompanyDialog
        open={dialogOpen}
        onClose={(refresh) => {
          setDialogOpen(false);
          setEditingCompany(null);
          if (refresh) fetchCompanies();
        }}
        company={editingCompany}
      />

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !open && setDeleteDialog({ open: false, company: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف <strong>{deleteDialog.company?.company_name}</strong>{" "}
              نهائياً
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
