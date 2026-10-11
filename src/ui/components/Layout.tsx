import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { PageHeader } from "@/components/PageHeader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function Layout() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "11.5rem",
          "--header-height": "3rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="md:m-2 md:ml-2 md:mr-0">
        <PageHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col items-start">
            {/* Added padding here */}
            <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 lg:p-8 w-full max-w-[1920px]">
              <Outlet />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
