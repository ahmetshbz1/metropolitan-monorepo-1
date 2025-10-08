export type StockAlertLevel = "critical" | "warning";

export interface StockAlertSummary {
  critical: number;
  warning: number;
  total: number;
}

export interface StockAlertItem {
  productId: string;
  productCode: string;
  productName: string;
  stock: number;
  individualPrice: string | null;
  corporatePrice: string | null;
  threshold: number;
  deficit: number;
  restockSuggestion: number;
  minQuantityIndividual: number;
  minQuantityCorporate: number;
  quantityPerBox: number | null;
  level: StockAlertLevel;
  updatedAt: string;
}

export interface StockAlertsResponse {
  success: true;
  items: StockAlertItem[];
  total: number;
  limit: number;
  summary: StockAlertSummary;
}
