import { Checkbox } from "@heroui/react";

interface BadgesInputProps {
  value: {
    halal?: boolean;
    vegetarian?: boolean;
    vegan?: boolean;
    glutenFree?: boolean;
    organic?: boolean;
    lactoseFree?: boolean;
  };
  onChange: (value: Record<string, boolean>) => void;
}

export const BadgesInput = ({ value, onChange }: BadgesInputProps) => {
  const handleChange = (field: string, checked: boolean) => {
    onChange({
      ...value,
      [field]: checked,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Sertifikalar / Rozetler
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Checkbox
          isSelected={value.halal || false}
          onValueChange={(checked) => handleChange("halal", checked)}
        >
          Helal
        </Checkbox>
        <Checkbox
          isSelected={value.vegetarian || false}
          onValueChange={(checked) => handleChange("vegetarian", checked)}
        >
          Vejetaryen
        </Checkbox>
        <Checkbox
          isSelected={value.vegan || false}
          onValueChange={(checked) => handleChange("vegan", checked)}
        >
          Vegan
        </Checkbox>
        <Checkbox
          isSelected={value.glutenFree || false}
          onValueChange={(checked) => handleChange("glutenFree", checked)}
        >
          Glutensiz
        </Checkbox>
        <Checkbox
          isSelected={value.organic || false}
          onValueChange={(checked) => handleChange("organic", checked)}
        >
          Organik
        </Checkbox>
        <Checkbox
          isSelected={value.lactoseFree || false}
          onValueChange={(checked) => handleChange("lactoseFree", checked)}
        >
          Laktozsuz
        </Checkbox>
      </div>
    </div>
  );
};
