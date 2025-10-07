import { useMemo, useState } from "react";
import {
  Button,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  ScrollShadow,
  Spacer,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
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
  Moon,
  Sun,
  LogOut,
  User,
  Layers,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { Breadcrumbs } from "./Breadcrumbs";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeKey?: string;
  onLogout: () => void;
  onNavigate?: (key: string) => void;
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
    key: "categories",
    label: "Kategoriler",
    description: "Kategori yönetimi",
    icon: Layers,
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
  onItemClick: (key: string) => void;
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
            onClick={() => onItemClick(item.key)}
            className={`group relative flex w-full items-center rounded-lg transition-all duration-200 ${
              collapsed ? "justify-center px-2 py-2" : "justify-start gap-2.5 px-2.5 py-2"
            } ${
              isActive
                ? "bg-blue-50 text-blue-600 dark:bg-[#2a2a2a] dark:text-blue-400"
                : "text-slate-600 hover:bg-slate-50 active:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#222222] dark:active:bg-[#2a2a2a]"
            }`}
          >
            {isActive && (
              <div className="absolute inset-y-0 left-0 w-0.5 rounded-r-full bg-blue-600 dark:bg-blue-400" />
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
  onNavigate,
}: AdminLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const sidebarWidthClass = isCollapsed ? "md:w-16" : "md:w-56";
  const sidebarHeader = useMemo(
    () =>
      isCollapsed ? null : (
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Metropolitan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Admin Panel</p>
        </div>
      ),
    [isCollapsed]
  );

  return (
    <div className="min-h-screen bg-slate-100 transition-colors dark:bg-[#0a0a0a]">
      <div className="relative flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-30 flex h-screen flex-col border-r border-slate-200 bg-white px-3 py-4 shadow-xl transition-all duration-300 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] md:shadow-none ${sidebarWidthClass} ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            {sidebarHeader}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 active:bg-slate-200 dark:text-slate-300 dark:hover:bg-[#2a2a2a] dark:active:bg-[#333333] md:hidden"
                aria-label="Menüyü kapat"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsCollapsed((prev) => !prev)}
                className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 active:bg-slate-200 dark:text-slate-300 dark:hover:bg-[#2a2a2a] dark:active:bg-[#333333] md:flex"
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
            onItemClick={(key) => {
              setIsMobileOpen(false);
              onNavigate?.(key);
            }}
          />
          <div className="mt-auto border-t border-slate-200 pt-3 dark:border-[#2a2a2a]">
            <Dropdown placement="top-start">
              <DropdownTrigger>
                <button
                  type="button"
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-slate-600 transition-colors hover:bg-slate-50 active:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#222222] dark:active:bg-[#2a2a2a] ${
                    isCollapsed ? "justify-center" : "justify-start"
                  }`}
                >
                  <Avatar
                    size="sm"
                    name="Admin"
                    className="h-8 w-8 flex-shrink-0"
                  />
                  {!isCollapsed && (
                    <div className="flex flex-1 flex-col items-start">
                      <span className="text-sm font-medium">Admin</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        admin@metropolitan.com
                      </span>
                    </div>
                  )}
                </button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Kullanıcı menüsü">
                <DropdownItem
                  key="theme"
                  startContent={
                    theme === "dark" ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )
                  }
                  onPress={toggleTheme}
                >
                  {theme === "dark" ? "Açık Tema" : "Koyu Tema"}
                </DropdownItem>
                <DropdownItem
                  key="logout"
                  color="danger"
                  startContent={<LogOut className="h-4 w-4" />}
                  onPress={onLogout}
                >
                  Çıkış Yap
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </aside>

        <div className={`flex flex-1 flex-col transition-all duration-300 ${isCollapsed ? "md:ml-16" : "md:ml-56"}`}>
          <Navbar className="sticky top-0 z-20 bg-white/80 px-4 py-3 shadow-sm backdrop-blur transition-colors dark:bg-[#1a1a1a]/95 dark:border-b dark:border-[#2a2a2a]" maxWidth="full">
            <NavbarContent justify="start" className="gap-2">
              <NavbarItem className="md:hidden">
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 active:bg-slate-200 dark:text-slate-300 dark:hover:bg-[#2a2a2a] dark:active:bg-[#333333]"
                  aria-label="Menüyü aç"
                >
                  <Menu className="h-4 w-4" />
                </button>
              </NavbarItem>
              <NavbarBrand>
                <Breadcrumbs
                  items={[
                    {
                      label: NAV_ITEMS.find((item) => item.key === activeKey)?.label ?? "Dashboard",
                      key: activeKey,
                    },
                  ]}
                  onNavigate={onNavigate}
                />
              </NavbarBrand>
            </NavbarContent>
            <NavbarContent justify="end">
              <NavbarItem className="md:hidden">
                <Dropdown>
                  <DropdownTrigger>
                    <Button isIconOnly variant="light" size="sm">
                      <Avatar size="sm" name="Admin" className="h-8 w-8" />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="Kullanıcı menüsü">
                    <DropdownItem
                      key="theme"
                      startContent={
                        theme === "dark" ? (
                          <Sun className="h-4 w-4" />
                        ) : (
                          <Moon className="h-4 w-4" />
                        )
                      }
                      onPress={toggleTheme}
                    >
                      {theme === "dark" ? "Açık Tema" : "Koyu Tema"}
                    </DropdownItem>
                    <DropdownItem
                      key="logout"
                      color="danger"
                      startContent={<LogOut className="h-4 w-4" />}
                      onPress={onLogout}
                    >
                      Çıkış Yap
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </NavbarItem>
            </NavbarContent>
          </Navbar>

          <main className="flex-1 px-4 pb-10 pt-6 md:px-10">
            <div className="mx-auto w-full max-w-7xl space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
};
