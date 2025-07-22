import type { Address } from "./address";
import type { Product } from "./product";

export interface ProductInItem extends Product {}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: string; // always string in API payloads
  totalPrice: string;
  product: ProductInItem;
}

export interface TrackingEvent {
  id: string;
  status: string;
  statusText: string;
  location: string;
  timestamp: string; // ISO string
  description: string | null;
  createdAt: string; // ISO string
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  currency: string;
  trackingNumber: string | null;
  shippingCompany: string;
  estimatedDelivery: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  shippingAddress: Address;
  paymentMethodType?: string; // Stripe payment method type
  paymentStatus?: string; // Stripe payment status
}

export interface OrderDetail extends OrderSummary {
  billingAddress?: Address;
  stripePaymentIntentId?: string;
  stripeClientSecret?: string;
  paidAt?: string; // ISO string
  user?: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    email?: string;
  };
}

export interface FullOrderPayload {
  order: OrderDetail;
  items: OrderItem[];
  trackingEvents: TrackingEvent[];
}

export type Order = OrderSummary;

// ===================================================================
// Creation request / response (mobile → backend)
// ===================================================================
export interface OrderCreationRequest {
  shippingAddressId: string;
  billingAddressId?: string;
  paymentMethodId: string;
  notes?: string;
}

export interface OrderCreationResult {
  success: boolean;
  order: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: string;
    currency: string;
    createdAt: Date | string;
    // Stripe payment fields (optional)
    stripePaymentIntentId?: string;
    stripeClientSecret?: string;
    paymentStatus?: string;
  };
}

// Invoice Types
export interface InvoiceData {
  invoiceNumber: string;
  orderNumber: string;
  issueDate: string;
  dueDate: string;
  seller: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    nip: string;
    email: string;
    phone: string;
  };
  buyer: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    nip?: string | null;
    email: string;
    phone: string | null;
  };
  items: InvoiceItem[];
  totalAmount: number;
  netAmount: number;
  vatAmount: number;
  totalAmountInWords: string;
  currency: string;
  paymentMethod: string;
  accountNumber: string;
  notes?: string;
}

export interface InvoiceItem {
  description: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  vatRate: number;
}

export interface InvoiceGenerationOptions {
  format?: "pdf";
}

export interface StockError {
  productId: string;
  productName: string;
  requestedQuantity: number;
  availableStock: number;
}
