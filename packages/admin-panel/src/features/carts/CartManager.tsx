import { useCallback, useEffect, useState } from "react";
import { Button, Pagination, Chip } from "@heroui/react";
import { ShoppingCart, RefreshCw, PackageX } from "lucide-react";
import { getCarts } from "../../api/carts";
import type { AdminCartItem, CartFilters as CartFiltersType } from "../../api/carts";
import { CartFilters } from "./components/CartFilters";
import { CartTable } from "./components/CartTable";
import { useToast } from "../../hooks/useToast";

export const CartManager = () => {
  const [carts, setCarts] = useState<AdminCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CartFiltersType>({});
  const [searchInput, setSearchInput] = useState("");
  const [limit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [totalCarts, setTotalCarts] = useState(0);
  const { showToast } = useToast();

  const loadCarts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCarts({ ...filters, limit, offset });
      setCarts(response.carts);
      setTotalCarts(response.total);
    } catch (error) {
      console.error("Sepetler yüklenemedi:", error);
      showToast({
        type: "error",
        title: "Yükleme başarısız",
        description: error instanceof Error ? error.message : "Sepetler yüklenemedi",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, limit, offset, showToast]);

  useEffect(() => {
    void loadCarts();
  }, [loadCarts]);

  const handleSearch = () => {
    setOffset(0);
    setFilters({ ...filters, search: searchInput || undefined });
  };

  const handleFiltersChange = useCallback((nextFilters: CartFiltersType) => {
    setOffset(0);
    setFilters(nextFilters);
  }, []);

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(totalCarts / limit));

  const handlePageChange = (page: number) => {
    setOffset((page - 1) * limit);
  };

  const abandonedCount = carts.filter(cart => cart.lastActivityDays >= (filters.abandonedDays || 1)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Kullanıcı Sepetleri
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {filters.abandonedOnly && (
            <Chip
              color="warning"
              variant="flat"
              startContent={<PackageX className="h-4 w-4" />}
            >
              {abandonedCount} Unutulan Sepet
            </Chip>
          )}
          <Button
            startContent={<RefreshCw className="h-4 w-4" />}
            onPress={loadCarts}
            isLoading={loading}
            variant="flat"
          >
            Yenile
          </Button>
        </div>
      </div>

      <CartFilters
        filters={filters}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onFiltersChange={handleFiltersChange}
        onSearch={handleSearch}
      />

      {totalPages > 1 ? (
        <div className="flex justify-end">
          <Pagination
            size="sm"
            showControls
            total={totalPages}
            page={currentPage}
            onChange={handlePageChange}
          />
        </div>
      ) : null}

      <CartTable
        carts={carts}
        loading={loading}
      />

      {totalPages > 1 ? (
        <div className="flex justify-center">
          <Pagination
            size="sm"
            showControls
            total={totalPages}
            page={currentPage}
            onChange={handlePageChange}
          />
        </div>
      ) : null}
    </div>
  );
};
