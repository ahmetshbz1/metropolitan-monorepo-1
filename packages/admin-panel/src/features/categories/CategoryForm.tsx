import { useState } from "react";
import { Button, Input, Tabs, Tab } from "@heroui/react";
import { Save } from "lucide-react";

import { SUPPORTED_LANGUAGES } from "./constants";
import type { AdminCategoryPayload, SupportedLanguage } from "./types";

interface TranslationState {
  name: string;
}

interface CategoryFormState {
  slug: string;
  translations: Record<SupportedLanguage, TranslationState>;
}

const createInitialState = (): CategoryFormState => ({
  slug: "",
  translations: SUPPORTED_LANGUAGES.reduce((acc, item) => {
    acc[item.code] = { name: "" };
    return acc;
  }, {} as Record<SupportedLanguage, TranslationState>),
});

interface CategoryFormProps {
  onSubmit: (payload: AdminCategoryPayload) => Promise<void>;
}

export const CategoryForm = ({ onSubmit }: CategoryFormProps) => {
  const [form, setForm] = useState<CategoryFormState>(createInitialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateField = (field: keyof CategoryFormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateTranslation = (
    languageCode: SupportedLanguage,
    field: keyof TranslationState,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [languageCode]: {
          ...prev.translations[languageCode],
          [field]: value,
        },
      },
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.slug || form.slug.trim().length < 2) {
      setError("Slug en az 2 karakter olmalıdır");
      return;
    }

    try {
      const translations = SUPPORTED_LANGUAGES.map((item) => {
        const translation = form.translations[item.code];
        if (!translation.name) {
          throw new Error(`${item.label} adı zorunludur`);
        }

        return {
          languageCode: item.code,
          name: translation.name,
        };
      });

      const payload: AdminCategoryPayload = {
        slug: form.slug,
        translations,
      };

      setIsSubmitting(true);
      await onSubmit(payload);
      setSuccess("Kategori başarıyla oluşturuldu");
      setForm(createInitialState());
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "İşlem başarısız oldu";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <Input
        label="Slug"
        placeholder="ornek-kategori"
        value={form.slug}
        onValueChange={(value) => updateField("slug", value)}
        variant="bordered"
        isRequired
      />

      <Tabs aria-label="Diller" variant="bordered">
        {SUPPORTED_LANGUAGES.map(({ code, label }) => (
          <Tab key={code} title={label}>
            <div className="flex flex-col gap-4 pt-4">
              <Input
                label="Kategori Adı"
                value={form.translations[code].name}
                onValueChange={(v) => updateTranslation(code, "name", v)}
                variant="bordered"
                isRequired
              />
            </div>
          </Tab>
        ))}
      </Tabs>

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-green-600 dark:text-green-400" role="status">
          {success}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 border-t pt-4 dark:border-[#2a2a2a]">
        <Button
          color="primary"
          type="submit"
          isLoading={isSubmitting}
          startContent={<Save className="h-4 w-4" />}
        >
          Kategori Oluştur
        </Button>
      </div>
    </form>
  );
};
