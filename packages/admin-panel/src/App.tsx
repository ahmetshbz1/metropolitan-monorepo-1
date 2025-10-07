import { useCallback, useEffect, useState } from "react";

import type { AdminLoginResponse } from "./api/auth";
import { ADMIN_TOKEN_STORAGE_KEY } from "./config/env";
import { LoginPage } from "./pages/LoginPage";

const storeToken = (token: string) => {
  localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
};

const retrieveToken = () => localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);

export default function App() {
  const [token, setToken] = useState<string | null>(() => retrieveToken());

  useEffect(() => {
    if (token) {
      storeToken(token);
    }
  }, [token]);

  const handleLoginSuccess = useCallback((payload: AdminLoginResponse) => {
    setToken(payload.accessToken);
  }, []);

  if (!token) {
    return <LoginPage onSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-12 text-center">
      <h2 className="text-2xl font-semibold text-slate-900">
        Yönetim paneli yakında hazır olacak.
      </h2>
      <p className="mt-3 max-w-md text-sm text-slate-600">
        Kimlik doğrulamanız başarılı. Dashboard ve diğer modüller sıradaki adımlarda
        eklenecek.
      </p>
    </div>
  );
}
