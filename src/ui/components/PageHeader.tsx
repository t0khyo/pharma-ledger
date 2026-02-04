import { useLocation } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DarkModeToggle } from "@/components/DarkModeToggle";

// Map routes to page titles
const pageTitles: Record<string, string> = {
  "/": "لوحة التحكم",
  "/debts": "الديون",
  "/customers": "العملاء",
  "/reports": "التقارير المالية",
  "/companies": "الشركات",
  "/settings": "الإعدادات",
  "/search": "البحث",
  "/profile": "الملف الشخصي",
};

export function PageHeader() {
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] || "";

  return (
    <header className="flex h-[var(--header-height)] shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-[var(--header-height)]">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{pageTitle}</h1>
        <div className="mr-auto">
          <DarkModeToggle />
        </div>
      </div>
    </header>
  );
}
