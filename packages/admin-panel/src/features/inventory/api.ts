import { apiClient } from "../../api/client";
import type { StockAlertLevel, StockAlertsResponse } from "./types";

interface GetStockAlertsParams {
  limit?: number;
  level?: StockAlertLevel | "all";
  search?: string;
}

export const getStockAlerts = async (
  params: GetStockAlertsParams = {}
): Promise<StockAlertsResponse> => {
  const searchParams = new URLSearchParams();

  if (params.limit !== undefined) {
    searchParams.append("limit", params.limit.toString());
  }

  if (params.level && params.level !== "all") {
    searchParams.append("level", params.level);
  }

  if (params.search && params.search.trim().length > 0) {
    searchParams.append("search", params.search.trim());
  }

  const url = `/admin/products/stock-alerts${
    searchParams.size > 0 ? `?${searchParams.toString()}` : ""
  }`;

  const response = await apiClient.get<StockAlertsResponse>(url);
  return response.data;
};

export const updateProductQuickSettings = async (
  productId: string,
  payload: {
    stock?: number;
    individualPrice?: number | null;
    corporatePrice?: number | null;
  }
) => {
  await apiClient.patch(`/admin/products/${productId}/quick-settings`, payload);
};
