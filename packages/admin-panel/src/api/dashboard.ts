import { API_URL, getAuthHeaders } from "../config/env";

export interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  recentOrders: RecentOrder[];
  salesTrend: SalesTrendData[];
  userGrowth: UserGrowthData[];
  topProducts: TopProduct[];
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string | null;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface SalesTrendData {
  date: string;
  revenue: number;
  orders: number;
}

export interface UserGrowthData {
  date: string;
  users: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalSold: number;
  revenue: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await fetch(`${API_URL}/admin/dashboard/stats`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Dashboard istatistikleri yüklenemedi");
  }

  return response.json();
};
