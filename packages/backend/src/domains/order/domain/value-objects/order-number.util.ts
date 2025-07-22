//  "order-number.util.ts"
//  metropolitan backend
//  Created by Ahmet on 06.07.2025.

/**
 * Sipariş numarası oluşturur (ORD-2025-001234 formatında)
 */
export const generateOrderNumber = (): string => {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  return `ORD-${year}-${timestamp}`;
};
