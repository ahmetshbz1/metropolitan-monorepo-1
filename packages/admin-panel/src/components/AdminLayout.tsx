import { useMemo, useState } from "react";
import {
  Button,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  ScrollShadow,
  Spacer,
} from "@heroui/react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeKey?: string;
  onLogout: () => void;
}

const NAV_ITEMS: Array<{
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    key: "dashboard",
    label: "Dashboard",
    description: "Özet ve izleme",
    icon: LayoutDashboard,
  },
  {
    key: "products",
    label: "Ürün Yönetimi",
    description: "Çok dilli içerikler",
    icon: Package,
  },
  {
    key: "orders",
    label: "Siparişler",
    description: "Sipariş akışı",
    icon: ShoppingCart,
  },
  {
    key: "users",
    label: "Kullanıcılar",
    description: "Müşteri & admin",
    icon: Users,
  },
  {
    key: "settings",
    label: "Ayarlar",
    description: "Sistem yapılandırması",
    icon: Settings,
  },
];

const SidebarNav = ({
  activeKey,
  collapsed,
  onItemClick,
}: {
  activeKey?: string;
  collapsed: boolean;
  onItemClick: () => void;
}) => (
  <ScrollShadow className="mt-4 flex-1">
    <div className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = item.key === activeKey;
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            onClick={onItemClick}
            className={`group relative flex w-full items-center rounded-lg transition-all duration-200 ${
              collapsed ? "justify-center px-2 py-2" : "justify-start gap-2.5 px-2.5 py-2"
            } ${
              isActive
                ? "bg-blue-50 text-blue-600"
                : "text-slate-600 hover:bg-slate-50 active:bg-slate-100"
            }`}
          >
            {isActive && (
              <div className="absolute inset-y-0 left-0 w-0.5 rounded-r-full bg-blue-600" />
            )}
            <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
            {!collapsed && (
              <span className="text-sm font-medium">{item.label}</span>
            )}
          </button>
        );
      })}
    </div>
  </ScrollShadow>
);

export const AdminLayout = ({
  children,
  activeKey = "products",
  onLogout,
}: AdminLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const sidebarWidthClass = isCollapsed ? "md:w-16" : "md:w-56";
  const sidebarHeader = useMemo(
    () =>
      isCollapsed ? null : (
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold text-slate-900">
            Metropolitan
          </h2>
          <p className="text-xs text-slate-500">Admin Panel</p>
        </div>
      ),
    [isCollapsed]
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="relative flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-30 flex h-screen flex-col border-r border-slate-200 bg-white px-3 py-4 shadow-xl transition-all duration-300 md:shadow-none ${sidebarWidthClass} ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            {sidebarHeader}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 active:bg-slate-200 md:hidden"
                aria-label="Menüyü kapat"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsCollapsed((prev) => !prev)}
                className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 active:bg-slate-200 md:flex"
                aria-label={isCollapsed ? "Menüyü genişlet" : "Menüyü daralt"}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <SidebarNav
            activeKey={activeKey}
            collapsed={isCollapsed}
            onItemClick={() => setIsMobileOpen(false)}
          />
        </aside>

        <div className={`flex flex-1 flex-col transition-all duration-300 ${isCollapsed ? "md:ml-16" : "md:ml-56"}`}>
          <Navbar className="sticky top-0 z-20 bg-white/80 px-4 py-3 shadow-sm backdrop-blur" maxWidth="full">
            <NavbarContent justify="start" className="gap-2">
              <NavbarItem className="md:hidden">
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 active:bg-slate-200"
                  aria-label="Menüyü aç"
                >
                  <Menu className="h-4 w-4" />
                </button>
              </NavbarItem>
              <NavbarBrand className="gap-3">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900">
                    Yönetim Paneli
                  </span>
                  <span className="text-xs text-slate-500">
                    {NAV_ITEMS.find((item) => item.key === activeKey)?.label ?? ""}
                  </span>
                </div>
              </NavbarBrand>
            </NavbarContent>
            <NavbarContent justify="end">
              <NavbarItem>
                <Button color="secondary" variant="bordered" onPress={onLogout}>
                  Çıkış Yap
                </Button>
              </NavbarItem>
            </NavbarContent>
          </Navbar>

          <main className="flex-1 px-4 pb-10 pt-6 md:px-10">
            <div className="mx-auto max-w-6xl space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
};
