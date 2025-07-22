//  "fakturownia.test.ts"
//  metropolitan backend
//  Created by Ahmet on 20.07.2025.

import { beforeAll, describe, expect, test } from "bun:test";
import { fakturowniaService } from "../shared/infrastructure/external/fakturownia.service";
import { FakturowniaAdapterService } from "../domains/order/application/use-cases/fakturownia-adapter.service";
import type { InvoiceData } from "@metropolitan/shared/types/order";

describe("Fakturownia Integration", () => {
  beforeAll(() => {
    // Ensure environment variables are set
    if (!process.env.FAKTUROWNIA_API_TOKEN) {
      throw new Error("FAKTUROWNIA_API_TOKEN is required for tests");
    }
    if (!process.env.FAKTUROWNIA_API_URL) {
      throw new Error("FAKTUROWNIA_API_URL is required for tests");
    }
  });

  test("API connection test", async () => {
    const isConnected = await fakturowniaService.testConnection();
    expect(isConnected).toBe(true);
  });

  test("InvoiceData validation", () => {
    const mockInvoiceData: InvoiceData = {
      invoiceNumber: "TEST-001",
      orderNumber: "ORD-123",
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      seller: {
        name: "Test Company",
        address: "Test Address 1",
        city: "Warszawa",
        postalCode: "00-001",
        country: "Polska",
        nip: "1234567890",
        email: "test@test.pl",
        phone: "+48123456789"
      },
      buyer: {
        name: "Test Buyer",
        address: "Buyer Address 1",
        city: "Kraków",
        postalCode: "30-001",
        country: "Polska",
        nip: "0987654321",
        email: "buyer@test.pl",
        phone: "+48987654321"
      },
      items: [
        {
          description: "Test Product",
          productCode: "TEST-001",
          quantity: 1,
          unitPrice: 100.00,
          totalPrice: 100.00,
          vatRate: 23
        }
      ],
      totalAmount: 123.00,
      netAmount: 100.00,
      vatAmount: 23.00,
      totalAmountInWords: "Test",
      currency: "PLN",
      paymentMethod: "transfer",
      accountNumber: "TEST"
    };

    const validation = FakturowniaAdapterService.validateForFakturownia(mockInvoiceData);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  test("Fakturownia format conversion", () => {
    const mockInvoiceData: InvoiceData = {
      invoiceNumber: "TEST-001",
      orderNumber: "ORD-123",
      issueDate: "2025-07-20T00:00:00.000Z",
      dueDate: "2025-08-19T00:00:00.000Z",
      seller: {
        name: "Test Company",
        address: "Test Address 1",
        city: "Warszawa",
        postalCode: "00-001",
        country: "Polska",
        nip: "1234567890",
        email: "test@test.pl",
        phone: "+48123456789"
      },
      buyer: {
        name: "Test Buyer",
        address: "Buyer Address 1",
        city: "Kraków",
        postalCode: "30-001",
        country: "Polska",
        nip: "0987654321",
        email: "buyer@test.pl",
        phone: "+48987654321"
      },
      items: [
        {
          description: "Test Product",
          productCode: "TEST-001",
          quantity: 2,
          unitPrice: 50.00,
          totalPrice: 100.00,
          vatRate: 23
        }
      ],
      totalAmount: 123.00,
      netAmount: 100.00,
      vatAmount: 23.00,
      totalAmountInWords: "Test",
      currency: "PLN",
      paymentMethod: "transfer",
      accountNumber: "TEST"
    };

    const fakturowniaInvoice = FakturowniaAdapterService.convertToFakturowniaFormat(mockInvoiceData);

    expect(fakturowniaInvoice.kind).toBe("vat");
    expect(fakturowniaInvoice.sell_date).toBe("2025-07-20");
    expect(fakturowniaInvoice.buyer_name).toBe("Test Buyer");
    expect(fakturowniaInvoice.buyer_city).toBe("Kraków");
    expect(fakturowniaInvoice.buyer_tax_no).toBe("0987654321");
    expect(fakturowniaInvoice.payment_type).toBe("transfer");
    expect(fakturowniaInvoice.payment_to).toBe("2025-08-19");
    expect(fakturowniaInvoice.positions).toHaveLength(1);
    expect(fakturowniaInvoice.positions[0].name).toBe("Test Product (TEST-001)");
    expect(fakturowniaInvoice.positions[0].quantity).toBe(2);
    expect(fakturowniaInvoice.positions[0].total_price_gross).toBe(100.00);
    expect(fakturowniaInvoice.positions[0].tax).toBe(23);
  });

  // Bu test sadece development'da çalışır (gerçek API çağrısı yapar)
  test.skipIf(process.env.NODE_ENV === "production")("Create test invoice (DEVELOPMENT ONLY)", async () => {
    const testInvoice = {
      kind: "vat" as const,
      sell_date: "2025-07-20",
      buyer_name: "Test Buyer for Integration",
      buyer_street: "Test Street 123",
      buyer_city: "Warszawa",
      buyer_post_code: "00-001",
      buyer_country: "Polska",
      buyer_email: "test@example.com",
      payment_type: "transfer",
      payment_to: "2025-08-19",
      positions: [
        {
          name: "Test Product (TEST-INTEGRATION)",
          tax: 23,
          total_price_gross: 123.00,
          quantity: 1,
          kind: "service"
        }
      ]
    };

    const response = await fakturowniaService.createInvoice(testInvoice);
    expect(response).toBeDefined();
    expect(response.id).toBeDefined();
    expect(response.number).toBeDefined();
    expect(response.buyer_name).toBe("Test Buyer for Integration");

    // PDF indirmeyi test et
    const pdfBuffer = await fakturowniaService.downloadInvoicePDF(response.id);
    expect(pdfBuffer).toBeDefined();
    expect(pdfBuffer.length).toBeGreaterThan(0);
    expect(pdfBuffer.subarray(0, 4).toString()).toBe("%PDF"); // PDF header check
  }, 30000); // 30s timeout
});

describe("Fakturownia Error Handling", () => {
  test("Invalid invoice data validation", () => {
    const invalidInvoiceData = {
      invoiceNumber: "TEST-INVALID",
      orderNumber: "ORD-INVALID",
      issueDate: new Date().toISOString(),
      dueDate: new Date().toISOString(),
      seller: {
        name: "Test Company",
        address: "Test Address",
        city: "Test City",
        postalCode: "00-000",
        country: "Test Country",
        nip: "1234567890",
        email: "test@test.pl",
        phone: "+48123456789"
      },
      buyer: {
        name: "", // Invalid: empty name
        address: "", // Invalid: empty address
        city: "", // Invalid: empty city
        postalCode: "00-000",
        country: "Polska",
        email: "test@test.pl",
        phone: "+48123456789"
      },
      items: [], // Invalid: no items
      totalAmount: 0,
      netAmount: 0,
      vatAmount: 0,
      totalAmountInWords: "",
      currency: "PLN",
      paymentMethod: "transfer",
      accountNumber: "TEST"
    } as InvoiceData;

    const validation = FakturowniaAdapterService.validateForFakturownia(invalidInvoiceData);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
    expect(validation.errors.some(error => error.includes("Alıcı adı eksik"))).toBe(true);
    expect(validation.errors.some(error => error.includes("Fatura kalemleri eksik"))).toBe(true);
  });
});