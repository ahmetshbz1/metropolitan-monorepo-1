import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminLoginResponse } from "./api/auth";
import { ADMIN_TOKEN_STORAGE_KEY } from "./config/env";
import { AdminLayout } from "./components/AdminLayout";
import { ProductManager } from "./features/products/ProductManager";
import { CategoryManager } from "./features/categories/CategoryManager";
import { OrderManager } from "./features/orders/OrderManager";
import { AISettings } from "./features/settings/AISettings";
import { LoginPage } from "./pages/LoginPage";

type AdminPage = "dashboard" | "categories" | "products" | "orders" | "users" | "settings";

const storeToken = (token: string) => {
  localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
};

const retrieveToken = () => localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);

const ACTIVE_PAGE_STORAGE_KEY = "metropolitan_admin_active_page";

const isAdminPage = (value: string | null | undefined): value is AdminPage =>
  value === "dashboard" ||
  value === "categories" ||
  value === "products" ||
  value === "orders" ||
  value === "users" ||
  value === "settings";

const getInitialActivePage = (): AdminPage => {
  if (typeof window === "undefined") {
    return "products";
  }
  const stored = window.localStorage.getItem(ACTIVE_PAGE_STORAGE_KEY);
  return isAdminPage(stored) ? stored : "products";
};

export default function App() {
  const [token, setToken] = useState<string | null>(() => retrieveToken());
  const [activePage, setActivePage] = useState<AdminPage>(() => getInitialActivePage());

  useEffect(() => {
    if (token) {
      storeToken(token);
    }
  }, [token]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_PAGE_STORAGE_KEY, activePage);
    }
  }, [activePage]);

  const handleLoginSuccess = useCallback((payload: AdminLoginResponse) => {
    setToken(payload.accessToken);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    setToken(null);
  }, []);

  if (!token) {
    return <LoginPage onSuccess={handleLoginSuccess} />;
  }

  const handleNavigate = useCallback((key: string) => {
    if (isAdminPage(key)) {
      setActivePage(key);
      return;
    }
    setActivePage("products");
  }, []);

  const renderPage = useMemo(() => {
    switch (activePage) {
      case "dashboard":
        return (
          <div className="rounded-lg border border-dashed border-slate-200 p-6 text-sm text-slate-500 dark:border-[#2a2a2a] dark:text-slate-400">
            Dashboard modülü yakında eklenecek.
          </div>
        );
      case "categories":
        return <CategoryManager />;
      case "products":
        return <ProductManager />;
      case "orders":
        return <OrderManager />;
      case "users":
        return (
          <div className="rounded-lg border border-dashed border-slate-200 p-6 text-sm text-slate-500 dark:border-[#2a2a2a] dark:text-slate-400">
            Kullanıcı yönetimi modülü yakında eklenecek.
          </div>
        );
      case "settings":
        return <AISettings />;
      default:
        return <ProductManager />;
    }
  }, [activePage]);

  return (
    <AdminLayout activeKey={activePage} onLogout={handleLogout} onNavigate={handleNavigate}>
      {renderPage}
    </AdminLayout>
  );
}
