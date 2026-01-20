import { type ColumnDef } from "@tanstack/react-table";
import { Building, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Company } from "../../../shared/types/company.types";

export const columns: ColumnDef<Company>[] = [
  {
    accessorKey: "company_name",
    header: "اسم الشركة",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-muted rounded">
            <Building className="w-4 h-4" />
          </div>
          <div className="font-medium">{row.getValue("company_name")}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "contact_person",
    header: "جهة الاتصال",
    cell: ({ row }) => {
      return row.getValue("contact_person") || "-";
    },
  },
  {
    accessorKey: "phone",
    header: "الهاتف",
    cell: ({ row }) => {
      return row.getValue("phone") || "-";
    },
  },
  {
    accessorKey: "created_at",
    header: "تاريخ الإنشاء",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return date.toLocaleDateString("ar-EG-u-nu-latn");
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const company = row.original;
      const meta = table.options.meta as any;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">فتح القائمة</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => meta?.onEdit(company)}>
              <Pencil className="ml-2 h-4 w-4" />
              تعديل
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => meta?.onDelete(company)}
              className="text-red-600"
            >
              <Trash2 className="ml-2 h-4 w-4" />
              حذف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
