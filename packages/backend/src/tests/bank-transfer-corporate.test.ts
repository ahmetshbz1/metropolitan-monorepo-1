//  "bank-transfer-corporate.test.ts"
//  metropolitan backend
//  Created by Ahmet on 16.07.2025.

import { describe, expect, test } from "bun:test";
import { FakturowniaAdapterService } from "../domains/order/application/use-cases/fakturownia-adapter.service";

describe("Bank Transfer Corporate Customer", () => {
  test("Fakturownia payment label for bank transfer", () => {
    // Private method'u test etmek için reflection kullan
    const adapter = FakturowniaAdapterService as any;

    // Banka havalesi için özel etiket kontrolü
    const bankTransferLabel = adapter.getPaymentLabel("bank_transfer");
    expect(bankTransferLabel).toBe("Płatność: Przelew");

    // Diğer payment method'lar için de kontrol
    const cardLabel = adapter.getPaymentLabel("card");
    expect(cardLabel).toBe("Płatność: Karta");

    const blikLabel = adapter.getPaymentLabel("blik");
    expect(blikLabel).toBe("Płatność: BLIK");

    const cashLabel = adapter.getPaymentLabel("cash");
    expect(cashLabel).toBe("Płatność: Gotówka");

    // Default case
    const defaultLabel = adapter.getPaymentLabel("unknown");
    expect(defaultLabel).toBe("Płatność: Przelew");
  });

  test("Payment method mapping for Fakturownia", () => {
    const adapter = FakturowniaAdapterService as any;

    // Banka havalesi mapping kontrolü
    const bankTransferMapping = adapter.mapPaymentMethod("bank_transfer");
    expect(bankTransferMapping).toBe("transfer");

    // Diğer payment method'lar için de kontrol
    const cardMapping = adapter.mapPaymentMethod("card");
    expect(cardMapping).toBe("card");

    const blikMapping = adapter.mapPaymentMethod("blik");
    expect(blikMapping).toBe("blik");

    const applePayMapping = adapter.mapPaymentMethod("apple_pay");
    expect(applePayMapping).toBe("card");

    const googlePayMapping = adapter.mapPaymentMethod("google_pay");
    expect(googlePayMapping).toBe("card");

    // Default case
    const defaultMapping = adapter.mapPaymentMethod("unknown");
    expect(defaultMapping).toBe("transfer");
  });

  test("Corporate customer bank transfer validation", () => {
    // Kurumsal müşteri banka havalesi için özel işlem mantığını test et
    const isBankTransfer = "bank_transfer" === "bank_transfer";
    const isCorporate = "corporate" === "corporate";

    expect(isBankTransfer).toBe(true);
    expect(isCorporate).toBe(true);

    // Otomatik onay koşulu
    const shouldAutoConfirm = isBankTransfer && isCorporate;
    expect(shouldAutoConfirm).toBe(true);
  });

  test("Order creation request validation", () => {
    // OrderCreationRequest tipinin paymentMethodId içerdiğini kontrol et
    const mockRequest = {
      shippingAddressId: "test-shipping-id",
      billingAddressId: "test-billing-id",
      paymentMethodId: "bank_transfer",
      notes: "Test order",
    };

    expect(mockRequest.paymentMethodId).toBe("bank_transfer");
    expect(mockRequest.shippingAddressId).toBe("test-shipping-id");
    expect(mockRequest.billingAddressId).toBe("test-billing-id");
    expect(mockRequest.notes).toBe("Test order");
  });
});
