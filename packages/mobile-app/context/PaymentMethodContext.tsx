//  "PaymentMethodContext.tsx"
//  metropolitan app
//  Created by Ahmet on 03.06.2025.

import { api } from "@/core/api";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

// Local Payment Method types (mobile-specific)
export type PaymentMethod = {
  id: string;
  type: string;
  name: string;
  details: string;
  expiry: string;
  isDefault: boolean;
};

export interface PaymentMethodData {
  type: string;
  name: string;
  details: string;
  expiry: string;
}

export interface PaymentMethodContextType {
  paymentMethods: PaymentMethod[];
  loading: boolean;
  error: string | null;
  addPaymentMethod: (method: PaymentMethodData) => Promise<void>;
  updatePaymentMethod: (id: string, updates: Partial<PaymentMethodData>) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
  setDefaultPaymentMethod: (id: string) => Promise<void>;
  refreshPaymentMethods: () => Promise<void>;
}

const PaymentMethodContext = createContext<
  PaymentMethodContextType | undefined
>(undefined);

export const PaymentMethodProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { token } = useAuth();

  const fetchPaymentMethods = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // Backend'de payment methods endpoint'i kaldırıldı
      // Stripe için hardcoded payment methods kullanıyoruz
      const defaultPaymentMethods: PaymentMethod[] = [
        {
          id: "card",
          type: "card",
          title: "Kredi/Banka Kartı",
          subtitle: "Visa, Mastercard",
          icon: "card",
          isDefault: true,
          isAvailable: true,
        },
        {
          id: "blik",
          type: "blik", 
          title: "BLIK",
          subtitle: "Mobil ödeme (6 haneli kod)",
          icon: "phone-portrait-outline",
          isDefault: false,
          isAvailable: true,
        },
      ];
      setPaymentMethods(defaultPaymentMethods);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  };

  const addPaymentMethod = async (paymentData: PaymentMethodData) => {
    try {
      // Payment methods artık backend'de tutulmuyor
      // Stripe payment method'ları dinamik olarak checkout'ta seçiliyor
      console.log("Payment method added:", paymentData);
      await fetchPaymentMethods(); // Listeyi güncelle
      return paymentData;
    } catch (e) {
      console.error("Failed to add payment method", e);
      throw e;
    }
  };

  const deletePaymentMethod = async (paymentMethodId: string) => {
    try {
      // Payment methods artık backend'de tutulmuyor
      // Hardcoded payment method'ları silinemez
      console.log("Payment method delete attempted:", paymentMethodId);
      throw new Error("Varsayılan ödeme yöntemleri silinemez");
    } catch (e) {
      console.error("Failed to delete payment method", e);
      throw e;
    }
  };

  useEffect(() => {
    if (token) {
      fetchPaymentMethods();
    } else {
      setPaymentMethods([]);
      setLoading(false);
    }
  }, [token]);

  return (
    <PaymentMethodContext.Provider
      value={{
        paymentMethods,
        loading,
        error,
        fetchPaymentMethods,
        addPaymentMethod,
        deletePaymentMethod,
      }}
    >
      {children}
    </PaymentMethodContext.Provider>
  );
};

export const usePaymentMethods = () => {
  const context = useContext(PaymentMethodContext);
  if (context === undefined) {
    throw new Error(
      "usePaymentMethods must be used within a PaymentMethodProvider"
    );
  }
  return context;
};
