import { useCallback, useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import type { AdminLoginResponse } from "./api/auth";
import { SESSION_EXPIRED_EVENT } from "./api/client";
import { ADMIN_TOKEN_STORAGE_KEY, ADMIN_TOKEN_EXPIRY_KEY } from "./config/env";
import { AdminLayout } from "./components/AdminLayout";
import { Dashboard } from "./features/dashboard/Dashboard";
import { ProductManager } from "./features/products/ProductManager";
import { CategoryManager } from "./features/categories/CategoryManager";
import { OrderManager } from "./features/orders/OrderManager";
import { UserManager } from "./features/users/UserManager";
import { CompanyManager } from "./features/companies/CompanyManager";
import { CartManager } from "./features/carts/CartManager";
import { AISettings } from "./features/settings/AISettings";
import { LoginPage } from "./pages/LoginPage";
import { StockAlertsPanel } from "./features/inventory/StockAlertsPanel";
import { PushNotificationsPage } from "./features/push-notifications/PushNotificationsPage";

// React Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 dakika
      gcTime: 1000 * 60 * 10, // 10 dakika (eski adı: cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

type AdminPage =
  | "dashboard"
  | "categories"
  | "products"
  | "inventory"
  | "orders"
  | "carts"
  | "companies"
  | "users"
  | "notifications"
  | "settings";

const storeToken = (token: string) => {
  localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
};

const retrieveToken = () => localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);

const ACTIVE_PAGE_STORAGE_KEY = "metropolitan_admin_active_page";

const isAdminPage = (value: string | null | undefined): value is AdminPage =>
  value === "dashboard" ||
  value === "categories" ||
  value === "products" ||
  value === "inventory" ||
  value === "orders" ||
  value === "carts" ||
  value === "companies" ||
  value === "users" ||
  value === "notifications" ||
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
  const [showSessionExpiredDialog, setShowSessionExpiredDialog] = useState(false);

  useEffect(() => {
    if (token) {
      storeToken(token);
    }
  }, [token]);

  // Session expired event listener
  useEffect(() => {
    const handleSessionExpired = () => {
      setShowSessionExpiredDialog(true);
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_PAGE_STORAGE_KEY, activePage);
    }
  }, [activePage]);

  const handleLoginSuccess = useCallback((payload: AdminLoginResponse) => {
    setActivePage("products");
    setToken(payload.accessToken);

    // Token expiry zamanını kaydet
    const expiryTime = Date.now() + payload.expiresIn * 1000;
    localStorage.setItem(ADMIN_TOKEN_EXPIRY_KEY, expiryTime.toString());
  }, []);

  const handleLogout = useCallback(() => {
    setActivePage("products");
    localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    localStorage.removeItem(ADMIN_TOKEN_EXPIRY_KEY);
    localStorage.removeItem(ACTIVE_PAGE_STORAGE_KEY);
    setToken(null);
    setShowSessionExpiredDialog(false);
  }, []);

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
        return <Dashboard />;
      case "categories":
        return <CategoryManager />;
      case "products":
        return <ProductManager />;
      case "inventory":
        return <StockAlertsPanel />;
      case "orders":
        return <OrderManager />;
      case "carts":
        return <CartManager />;
      case "companies":
        return <CompanyManager />;
      case "users":
        return <UserManager />;
      case "notifications":
        return <PushNotificationsPage />;
      case "settings":
        return <AISettings />;
      default:
        return <ProductManager />;
    }
  }, [activePage]);

  if (!token) {
    return <LoginPage onSuccess={handleLoginSuccess} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AdminLayout activeKey={activePage} onLogout={handleLogout} onNavigate={handleNavigate}>
        {renderPage}
      </AdminLayout>
      <ReactQueryDevtools initialIsOpen={false} />

      {/* Session expired dialog */}
      <Modal
        isOpen={showSessionExpiredDialog}
        onClose={handleLogout}
        isDismissable={false}
        hideCloseButton
        size="sm"
        placement="center"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Oturum Sonlandırıldı
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Güvenlik nedeniyle oturumunuz sonlandırılmıştır. Lütfen tekrar giriş yapınız.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={handleLogout}>
              Tamam
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </QueryClientProvider>
  );
}
