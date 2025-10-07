import { useCallback, useEffect, useState } from "react";
import type { AdminLoginResponse } from "./api/auth";
import { ADMIN_TOKEN_STORAGE_KEY } from "./config/env";
import { AdminLayout } from "./components/AdminLayout";
import { ProductManager } from "./features/products/ProductManager";
import { CategoryManager } from "./features/categories/CategoryManager";
import { AISettings } from "./features/settings/AISettings";
import { LoginPage } from "./pages/LoginPage";

const storeToken = (token: string) => {
  localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
};

const retrieveToken = () => localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);

export default function App() {
  const [token, setToken] = useState<string | null>(() => retrieveToken());
  const [activePage, setActivePage] = useState<string>("products");

  useEffect(() => {
    if (token) {
      storeToken(token);
    }
  }, [token]);

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

  const renderPage = () => {
    switch (activePage) {
      case "categories":
        return <CategoryManager />;
      case "products":
        return <ProductManager />;
      case "settings":
        return <AISettings />;
      default:
        return <ProductManager />;
    }
  };

  return (
    <AdminLayout activeKey={activePage} onLogout={handleLogout} onNavigate={setActivePage}>
      {renderPage()}
    </AdminLayout>
  );
}
