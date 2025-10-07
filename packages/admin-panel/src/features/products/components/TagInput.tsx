import { useState } from "react";
import { Button, Chip, Input } from "@heroui/react";
import { Plus } from "lucide-react";

interface TagInputProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export const TagInput = ({ label, value, onChange, placeholder }: TagInputProps) => {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInputValue("");
    }
  };

  const handleRemove = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <div className="flex gap-2">
        <Input
          size="sm"
          placeholder={placeholder || "Eklemek için yazın..."}
          value={inputValue}
          onValueChange={setInputValue}
          onKeyPress={handleKeyPress}
          variant="bordered"
          className="flex-1"
        />
        <Button
          size="sm"
          variant="flat"
          color="primary"
          startContent={<Plus className="h-4 w-4" />}
          onPress={handleAdd}
          isDisabled={!inputValue.trim()}
        >
          Ekle
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <Chip
            key={tag}
            onClose={() => handleRemove(tag)}
            variant="flat"
            color="primary"
          >
            {tag}
          </Chip>
        ))}
        {value.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Henüz eklenmemiş
          </p>
        )}
      </div>
    </div>
  );
};
