import { useEffect, useState } from "react";
import { Card, CardBody, Spinner, Chip } from "@heroui/react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  ShoppingBag,
  Users,
  Package,
  Layers,
  TrendingUp,
  Calendar,
  DollarSign,
} from "lucide-react";
import { getDashboardStats, type DashboardStats } from "../../api/dashboard";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: "primary" | "success" | "warning" | "secondary";
}

const StatCard = ({ title, value, icon, color }: StatCardProps) => {
  const colorClasses = {
    primary: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    success: "bg-green-500/10 text-green-600 dark:text-green-400",
    warning: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    secondary: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  };

  return (
    <Card className="border border-slate-200 dark:border-[#2a2a2a]">
      <CardBody className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {value}
            </p>
          </div>
          <div className={`rounded-lg p-3 ${colorClasses[color]}`}>{icon}</div>
        </div>
      </CardBody>
    </Card>
  );
};

export const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error("Dashboard yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-[#2a2a2a] dark:text-slate-400">
        Dashboard verileri yüklenemedi
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
    }).format(value);
  };

  const getStatusColor = (
    status: string
  ): "success" | "warning" | "default" | "primary" => {
    const statusColors: Record<
      string,
      "success" | "warning" | "default" | "primary"
    > = {
      completed: "success",
      pending: "warning",
      processing: "primary",
      cancelled: "default",
    };
    return statusColors[status] || "default";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: "Tamamlandı",
      pending: "Bekliyor",
      processing: "İşleniyor",
      cancelled: "İptal",
      refunded: "İade",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Genel bakış ve istatistikler
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Toplam Ürün"
          value={stats.totalProducts}
          icon={<Package className="h-6 w-6" />}
          color="primary"
        />
        <StatCard
          title="Toplam Kategori"
          value={stats.totalCategories}
          icon={<Layers className="h-6 w-6" />}
          color="secondary"
        />
        <StatCard
          title="Toplam Kullanıcı"
          value={stats.totalUsers}
          icon={<Users className="h-6 w-6" />}
          color="warning"
        />
        <StatCard
          title="Toplam Sipariş"
          value={stats.totalOrders}
          icon={<ShoppingBag className="h-6 w-6" />}
          color="success"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border border-slate-200 dark:border-[#2a2a2a]">
          <CardBody className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-3">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Toplam Gelir
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-slate-200 dark:border-[#2a2a2a]">
          <CardBody className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-3">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Aylık Gelir
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(stats.monthlyRevenue)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-slate-200 dark:border-[#2a2a2a]">
          <CardBody className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 p-3">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Haftalık Gelir
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(stats.weeklyRevenue)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border border-slate-200 dark:border-[#2a2a2a]">
          <CardBody className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
              Satış Trendi (Son 30 Gün)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.salesTrend}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-slate-200 dark:stroke-slate-700"
                />
                <XAxis
                  dataKey="date"
                  className="text-xs text-slate-500 dark:text-slate-400"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                    })
                  }
                />
                <YAxis className="text-xs text-slate-500 dark:text-slate-400" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgb(15 23 42)",
                    border: "1px solid rgb(51 65 85)",
                    borderRadius: "0.5rem",
                  }}
                  formatter={(value: number, name: string) => [
                    name === "revenue" ? formatCurrency(value) : value,
                    name === "revenue" ? "Gelir" : "Sipariş",
                  ]}
                  labelFormatter={(label) =>
                    new Date(label).toLocaleDateString("tr-TR")
                  }
                />
                <Legend
                  formatter={(value) =>
                    value === "revenue" ? "Gelir" : "Sipariş Sayısı"
                  }
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#10b981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card className="border border-slate-200 dark:border-[#2a2a2a]">
          <CardBody className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
              Kullanıcı Artışı (Son 30 Gün)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.userGrowth}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-slate-200 dark:stroke-slate-700"
                />
                <XAxis
                  dataKey="date"
                  className="text-xs text-slate-500 dark:text-slate-400"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                    })
                  }
                />
                <YAxis className="text-xs text-slate-500 dark:text-slate-400" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgb(15 23 42)",
                    border: "1px solid rgb(51 65 85)",
                    borderRadius: "0.5rem",
                  }}
                  formatter={(value: number) => [value, "Yeni Kullanıcı"]}
                  labelFormatter={(label) =>
                    new Date(label).toLocaleDateString("tr-TR")
                  }
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border border-slate-200 dark:border-[#2a2a2a]">
          <CardBody className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
              En Çok Satan Ürünler
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topProducts} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-slate-200 dark:stroke-slate-700"
                />
                <XAxis
                  type="number"
                  className="text-xs text-slate-500 dark:text-slate-400"
                />
                <YAxis
                  dataKey="productName"
                  type="category"
                  className="text-xs text-slate-500 dark:text-slate-400"
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgb(15 23 42)",
                    border: "1px solid rgb(51 65 85)",
                    borderRadius: "0.5rem",
                  }}
                  formatter={(value: number, name: string) => [
                    name === "revenue" ? formatCurrency(value) : value,
                    name === "revenue" ? "Gelir" : "Satılan",
                  ]}
                />
                <Legend
                  formatter={(value) =>
                    value === "revenue" ? "Gelir" : "Satılan Adet"
                  }
                />
                <Bar dataKey="totalSold" fill="#8b5cf6" />
                <Bar dataKey="revenue" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card className="border border-slate-200 dark:border-[#2a2a2a]">
          <CardBody className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
              Son Siparişler
            </h3>
            <div className="space-y-3">
              {stats.recentOrders.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Henüz sipariş yok
                </p>
              ) : (
                stats.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-[#2a2a2a]"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {order.orderNumber}
                        </p>
                        <Chip size="sm" color={getStatusColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Chip>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {order.customerName || "Misafir"} •{" "}
                        {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(order.totalAmount)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
