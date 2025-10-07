import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { Plus, X } from "lucide-react";

interface KeyValuePair {
  key: string;
  value: string;
}

interface KeyValueInputProps {
  label: string;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

export const KeyValueInput = ({ label, value, onChange }: KeyValueInputProps) => {
  const [pairs, setPairs] = useState<KeyValuePair[]>(() => {
    return Object.entries(value).map(([key, val]) => ({
      key,
      value: String(val),
    }));
  });

  const handleAdd = () => {
    setPairs([...pairs, { key: "", value: "" }]);
  };

  const handleRemove = (index: number) => {
    const newPairs = pairs.filter((_, i) => i !== index);
    setPairs(newPairs);
    updateParent(newPairs);
  };

  const handleChange = (index: number, field: "key" | "value", val: string) => {
    const newPairs = [...pairs];
    newPairs[index][field] = val;
    setPairs(newPairs);
    updateParent(newPairs);
  };

  const updateParent = (newPairs: KeyValuePair[]) => {
    const obj = newPairs.reduce((acc, pair) => {
      if (pair.key.trim()) {
        acc[pair.key] = pair.value;
      }
      return acc;
    }, {} as Record<string, string>);
    onChange(obj);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
        <Button
          size="sm"
          variant="flat"
          color="primary"
          startContent={<Plus className="h-4 w-4" />}
          onPress={handleAdd}
        >
          Ekle
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {pairs.map((pair, index) => (
          <div key={index} className="flex gap-2">
            <Input
              size="sm"
              placeholder="Anahtar"
              value={pair.key}
              onValueChange={(v) => handleChange(index, "key", v)}
              variant="bordered"
              className="flex-1"
            />
            <Input
              size="sm"
              placeholder="Değer"
              value={pair.value}
              onValueChange={(v) => handleChange(index, "value", v)}
              variant="bordered"
              className="flex-1"
            />
            <Button
              size="sm"
              isIconOnly
              variant="flat"
              color="danger"
              onPress={() => handleRemove(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {pairs.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Henüz eklenmemiş. Ekle butonuna tıklayın.
          </p>
        )}
      </div>
    </div>
  );
};
