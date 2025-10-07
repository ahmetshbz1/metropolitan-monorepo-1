import { Input } from "@heroui/react";

interface NutritionalValuesInputProps {
  value: {
    energy?: string;
    fat?: string;
    saturatedFat?: string;
    carbohydrates?: string;
    sugar?: string;
    protein?: string;
    salt?: string;
  };
  onChange: (value: Record<string, string>) => void;
}

const extractNumber = (val: string): string => {
  return val.replace(/[^\d.]/g, "");
};

const getDisplayValue = (val: string | undefined): string => {
  if (!val) return "";
  return extractNumber(val);
};

export const NutritionalValuesInput = ({ value, onChange }: NutritionalValuesInputProps) => {
  const handleChange = (field: string, val: string, unit: string) => {
    const numericValue = extractNumber(val);
    const finalValue = numericValue ? `${numericValue}${unit}` : "";
    onChange({
      ...value,
      [field]: finalValue,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Besin Değerleri (100g başına)
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input
          label="Enerji"
          placeholder="126"
          value={getDisplayValue(value.energy)}
          onValueChange={(v) => handleChange("energy", v, " kcal")}
          variant="bordered"
          size="sm"
          endContent={<span className="text-xs text-slate-500">kcal</span>}
        />
        <Input
          label="Yağ"
          placeholder="7.9"
          value={getDisplayValue(value.fat)}
          onValueChange={(v) => handleChange("fat", v, "g")}
          variant="bordered"
          size="sm"
          endContent={<span className="text-xs text-slate-500">g</span>}
        />
        <Input
          label="Doymuş Yağ"
          placeholder="4.4"
          value={getDisplayValue(value.saturatedFat)}
          onValueChange={(v) => handleChange("saturatedFat", v, "g")}
          variant="bordered"
          size="sm"
          endContent={<span className="text-xs text-slate-500">g</span>}
        />
        <Input
          label="Karbonhidrat"
          placeholder="19.5"
          value={getDisplayValue(value.carbohydrates)}
          onValueChange={(v) => handleChange("carbohydrates", v, "g")}
          variant="bordered"
          size="sm"
          endContent={<span className="text-xs text-slate-500">g</span>}
        />
        <Input
          label="Şeker"
          placeholder="2.9"
          value={getDisplayValue(value.sugar)}
          onValueChange={(v) => handleChange("sugar", v, "g")}
          variant="bordered"
          size="sm"
          endContent={<span className="text-xs text-slate-500">g</span>}
        />
        <Input
          label="Protein"
          placeholder="13.7"
          value={getDisplayValue(value.protein)}
          onValueChange={(v) => handleChange("protein", v, "g")}
          variant="bordered"
          size="sm"
          endContent={<span className="text-xs text-slate-500">g</span>}
        />
        <Input
          label="Tuz"
          placeholder="2.07"
          value={value.salt || ""}
          onValueChange={(v) => handleChange("salt", v, "g")}
          variant="bordered"
          size="sm"
          endContent={<span className="text-xs text-slate-500">g</span>}
        />
      </div>
    </div>
  );
};
