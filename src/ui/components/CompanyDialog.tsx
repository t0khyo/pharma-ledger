import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { companyService } from "@/services/company.service";
import type {
  Company,
  CreateCompanyDTO,
  UpdateCompanyDTO,
} from "../../shared/types/company.types";
import { toast } from "sonner";

interface CompanyDialogProps {
  open: boolean;
  onClose: (shouldRefresh?: boolean) => void;
  company?: Company | null;
}

export function CompanyDialog({ open, onClose, company }: CompanyDialogProps) {
  const [formData, setFormData] = useState({
    company_name: "",
    contact_person: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = !!company;

  useEffect(() => {
    if (open && company) {
      setFormData({
        company_name: company.company_name,
        contact_person: company.contact_person || "",
        phone: company.phone || "",
      });
    } else if (open && !company) {
      setFormData({
        company_name: "",
        contact_person: "",
        phone: "",
      });
    }
    setErrors({});
  }, [open, company]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.company_name.trim()) {
      newErrors.company_name = "اسم الشركة مطلوب";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("فشل التحقق", {
        description: "يرجى ملء جميع الحقول المطلوبة",
      });
      return;
    }

    setSaving(true);
    const loadingToast = toast.loading(
      isEditMode ? "جاري تحديث الشركة..." : "جاري إنشاء الشركة..."
    );

    try {
      if (isEditMode && company) {
        const updateData: UpdateCompanyDTO = {
          company_name: formData.company_name,
          contact_person: formData.contact_person || undefined,
          phone: formData.phone || undefined,
        };
        await companyService.update(company.company_id, updateData);
        toast.success("تم تحديث الشركة", {
          id: loadingToast,
          description: `تم تحديث ${formData.company_name} بنجاح`,
        });
      } else {
        const createData: CreateCompanyDTO = {
          company_name: formData.company_name,
          contact_person: formData.contact_person || undefined,
          phone: formData.phone || undefined,
        };
        await companyService.create(createData);
        toast.success("تم إنشاء الشركة", {
          id: loadingToast,
          description: `تم إضافة ${formData.company_name} بنجاح`,
        });
      }

      onClose(true);
    } catch (error) {
      console.error("Failed to save company:", error);
      toast.error(isEditMode ? "فشل تحديث الشركة" : "فشل إنشاء الشركة", {
        id: loadingToast,
        description: error instanceof Error ? error.message : "خطأ غير معروف",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] [&>button]:left-4 [&>button]:right-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "تعديل الشركة" : "إضافة شركة جديدة"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "قم بتحديث معلومات الشركة أدناه."
              : "املأ التفاصيل لإضافة شركة جديدة."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">
                اسم الشركة <span className="text-red-500">*</span>
              </Label>
              <Input
                id="company_name"
                placeholder="أدخل اسم الشركة"
                value={formData.company_name}
                onChange={(e) =>
                  setFormData({ ...formData, company_name: e.target.value })
                }
                className={errors.company_name ? "border-red-500" : ""}
              />
              {errors.company_name && (
                <p className="text-sm text-red-500">{errors.company_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_person">جهة الاتصال</Label>
              <Input
                id="contact_person"
                placeholder="أدخل اسم جهة الاتصال"
                value={formData.contact_person}
                onChange={(e) =>
                  setFormData({ ...formData, contact_person: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                placeholder="أدخل رقم الهاتف"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose()}
              disabled={saving}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "جاري الحفظ..." : isEditMode ? "تحديث" : "إنشاء"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
