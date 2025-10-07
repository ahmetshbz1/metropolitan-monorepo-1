import { Button, Card, CardBody, Input, Select, SelectItem, type Selection } from "@heroui/react";
import { Search } from "lucide-react";
import type { UserFilters as UserFiltersType } from "../../../api/users";

interface UserFiltersProps {
  filters: UserFiltersType;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onFiltersChange: (filters: UserFiltersType) => void;
  onSearch: () => void;
}

const USER_TYPES = [
  { value: "", label: "Tümü" },
  { value: "individual", label: "Bireysel" },
  { value: "corporate", label: "Kurumsal" },
];

export const UserFilters = ({
  filters,
  searchInput,
  onSearchInputChange,
  onFiltersChange,
  onSearch,
}: UserFiltersProps) => {
  return (
    <Card className="dark:bg-[#1a1a1a] dark:border dark:border-[#2a2a2a]">
      <CardBody className="gap-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

          <div className="flex gap-2 md:col-span-2">
            <Input
              placeholder="İsim, email veya telefon ara..."
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
