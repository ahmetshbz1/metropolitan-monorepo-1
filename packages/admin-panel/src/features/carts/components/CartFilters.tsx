import { Button, Card, CardBody, Input, Select, SelectItem, Switch, type Selection } from "@heroui/react";
import { Search } from "lucide-react";
import type { CartFilters as CartFiltersType } from "../../../api/carts";

interface CartFiltersProps {
  filters: CartFiltersType;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onFiltersChange: (filters: CartFiltersType) => void;
  onSearch: () => void;
}

const USER_TYPES = [
  { value: "", label: "Tümü" },
  { value: "individual", label: "Bireysel" },
  { value: "corporate", label: "Kurumsal" },
];

const ABANDONED_DAYS_OPTIONS = [
  { value: "1", label: "1 gün" },
  { value: "3", label: "3 gün" },
  { value: "7", label: "7 gün" },
  { value: "14", label: "14 gün" },
  { value: "30", label: "30 gün" },
];

export const CartFilters = ({
  filters,
  searchInput,
  onSearchInputChange,
  onFiltersChange,
  onSearch,
}: CartFiltersProps) => {
  return (
    <Card className="dark:bg-[#1a1a1a] dark:border dark:border-[#2a2a2a]">
      <CardBody className="gap-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Select
            label="Kullanıcı Tipi"
            placeholder="Tümü"
            selectedKeys={filters.userType ? new Set<Selection>([filters.userType]) : new Set()}
            onSelectionChange={(keys) => {
              if (keys === "all" || keys.size === 0) {
                onFiltersChange({ ...filters, userType: undefined });
                return;
              }

              const [value] = keys;
              onFiltersChange({ ...filters, userType: value as string });
            }}
            classNames={{
              trigger: "dark:bg-[#0a0a0a] dark:border-[#2a2a2a]",
            }}
          >
            {USER_TYPES.map((type) => (
              <SelectItem key={type.value}>{type.label}</SelectItem>
            ))}
          </Select>

          <div className="flex flex-col justify-end">
            <Switch
              isSelected={filters.abandonedOnly ?? false}
              onValueChange={(value) => {
                onFiltersChange({
                  ...filters,
                  abandonedOnly: value,
                  abandonedDays: value ? (filters.abandonedDays || 1) : undefined,
                });
              }}
            >
              Sadece Unutulan Sepetler
            </Switch>
          </div>

          {filters.abandonedOnly && (
            <Select
              label="Unutulma Süresi"
              placeholder="1 gün"
              selectedKeys={filters.abandonedDays ? new Set<Selection>([String(filters.abandonedDays)]) : new Set(["1"])}
              onSelectionChange={(keys) => {
                if (keys === "all" || keys.size === 0) {
                  onFiltersChange({ ...filters, abandonedDays: 1 });
                  return;
                }

                const [value] = keys;
                onFiltersChange({ ...filters, abandonedDays: Number(value) });
              }}
              classNames={{
                trigger: "dark:bg-[#0a0a0a] dark:border-[#2a2a2a]",
              }}
            >
              {ABANDONED_DAYS_OPTIONS.map((option) => (
                <SelectItem key={option.value}>{option.label}</SelectItem>
              ))}
            </Select>
          )}

          <div className={`flex gap-2 ${filters.abandonedOnly ? '' : 'md:col-span-2'}`}>
            <Input
              placeholder="Kullanıcı veya ürün ara..."
              value={searchInput}
              onValueChange={onSearchInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSearch();
                }
              }}
              startContent={<Search className="h-4 w-4 text-slate-400" />}
              classNames={{
                inputWrapper: "dark:bg-[#0a0a0a] dark:border-[#2a2a2a]",
              }}
            />
            <Button onPress={onSearch} variant="flat">
              Ara
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
