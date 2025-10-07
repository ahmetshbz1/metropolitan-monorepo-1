import { eq, sql, and, gte } from "drizzle-orm";
import { db } from "../../../../../shared/infrastructure/database/connection";
import {
  products,
  productTranslations,
  categories,
  users,
  orders,
  orderItems,
} from "../../../../../shared/infrastructure/database/schema";
import { subDays, startOfDay } from "date-fns";

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
  createdAt: Date;
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

export const getDashboardStatsService = async (): Promise<DashboardStats> => {
  const now = new Date();
  const thirtyDaysAgo = startOfDay(subDays(now, 30));
  const sevenDaysAgo = startOfDay(subDays(now, 7));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalProducts] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products);

  const [totalCategories] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(categories);

  const [totalUsers] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users);

  const [totalOrders] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders);

  // Debug: payment status kontrolü
  const paymentStatuses = await db
    .select({
      paymentStatus: orders.paymentStatus,
      count: sql<number>`count(*)::int`,
      totalAmount: sql<number>`coalesce(sum(${orders.totalAmount}), 0)::numeric`
    })
    .from(orders)
    .groupBy(orders.paymentStatus);

  console.log("💳 Payment status breakdown:", paymentStatuses);

  const [totalRevenueResult] = await db
    .select({ sum: sql<number>`coalesce(sum(${orders.totalAmount}), 0)::numeric` })
    .from(orders)
    .where(eq(orders.paymentStatus, "succeeded"));

  const [monthlyRevenueResult] = await db
    .select({ sum: sql<number>`coalesce(sum(${orders.totalAmount}), 0)::numeric` })
    .from(orders)
    .where(
      and(eq(orders.paymentStatus, "succeeded"), gte(orders.createdAt, startOfMonth))
    );

  const [weeklyRevenueResult] = await db
    .select({ sum: sql<number>`coalesce(sum(${orders.totalAmount}), 0)::numeric` })
    .from(orders)
    .where(
      and(eq(orders.paymentStatus, "succeeded"), gte(orders.createdAt, sevenDaysAgo))
    );

  const recentOrdersData = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerName: sql<string | null>`${users.firstName} || ' ' || ${users.lastName}`,
      totalAmount: orders.totalAmount,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .orderBy(sql`${orders.createdAt} desc`)
    .limit(10);

  const salesTrendRaw = await db
    .select({
      date: sql<string>`date(${orders.createdAt})`,
      revenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)::numeric`,
      orders: sql<number>`count(*)::int`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.paymentStatus, "succeeded"),
        gte(orders.createdAt, thirtyDaysAgo)
      )
    )
    .groupBy(sql`date(${orders.createdAt})`)
    .orderBy(sql`date(${orders.createdAt})`);

  const userGrowthRaw = await db
    .select({
      date: sql<string>`date(${users.createdAt})`,
      users: sql<number>`count(*)::int`,
    })
    .from(users)
    .where(gte(users.createdAt, thirtyDaysAgo))
    .groupBy(sql`date(${users.createdAt})`)
    .orderBy(sql`date(${users.createdAt})`);

  const topProductsRaw = await db
    .select({
      productId: orderItems.productId,
      productName: sql<string>`COALESCE(${productTranslations.name}, ${products.productCode})`,
      totalSold: sql<number>`sum(${orderItems.quantity})::int`,
      revenue: sql<number>`sum(${orderItems.totalPrice})::numeric`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .leftJoin(
      productTranslations,
      and(
        eq(productTranslations.productId, products.id),
        eq(productTranslations.languageCode, "en")
      )
    )
    .where(eq(orders.paymentStatus, "succeeded"))
    .groupBy(orderItems.productId, products.productCode, productTranslations.name)
    .orderBy(sql`sum(${orderItems.totalPrice}) desc`)
    .limit(5);

  return {
    totalProducts: totalProducts?.count || 0,
    totalCategories: totalCategories?.count || 0,
    totalUsers: totalUsers?.count || 0,
    totalOrders: totalOrders?.count || 0,
    totalRevenue: Number(totalRevenueResult?.sum || 0),
    monthlyRevenue: Number(monthlyRevenueResult?.sum || 0),
    weeklyRevenue: Number(weeklyRevenueResult?.sum || 0),
    recentOrders: recentOrdersData,
    salesTrend: salesTrendRaw.map((item) => ({
      date: item.date,
      revenue: Number(item.revenue),
      orders: item.orders,
    })),
    userGrowth: userGrowthRaw.map((item) => ({
      date: item.date,
      users: item.users,
    })),
    topProducts: topProductsRaw.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      totalSold: item.totalSold,
      revenue: Number(item.revenue),
    })),
  };
};
