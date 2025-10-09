import { useEffect, useState } from "react";
import { Button, Input, Tabs, Tab, Checkbox, Card, CardBody } from "@heroui/react";
import { Save } from "lucide-react";

import { SUPPORTED_LANGUAGES } from "./constants";
import type { AdminCategory, AdminCategoryPayload, AdminUpdateCategoryPayload, SupportedLanguage } from "./types";

interface TranslationState {
  name: string;
}

interface CategoryFormState {
  slug: string;
  manualTranslationMode: boolean;
  translations: Record<SupportedLanguage, TranslationState>;
}

const createInitialState = (): CategoryFormState => ({
  slug: "",
  manualTranslationMode: false,
  translations: SUPPORTED_LANGUAGES.reduce((acc, item) => {
    acc[item.code] = { name: "" };
    return acc;
  }, {} as Record<SupportedLanguage, TranslationState>),
});

const loadCategoryToForm = (category: AdminCategory): CategoryFormState => {
  const translations: Record<SupportedLanguage, TranslationState> = {} as Record<SupportedLanguage, TranslationState>;

  SUPPORTED_LANGUAGES.forEach((lang) => {
    translations[lang.code] = {
      name: category.translations[lang.code]?.name || "",
    };
  });

  const hasAllTranslations = SUPPORTED_LANGUAGES.every(
    (lang) => category.translations[lang.code]?.name
  );

  return {
    slug: category.slug,
    manualTranslationMode: hasAllTranslations,
    translations,
  };
};

interface CategoryFormProps {
  mode?: "create" | "update";
  initialCategory?: AdminCategory;
  onSubmit: (payload: AdminCategoryPayload | AdminUpdateCategoryPayload, categoryId?: string) => Promise<void>;
}

export const CategoryForm = ({ mode = "create", initialCategory, onSubmit }: CategoryFormProps) => {
  const [form, setForm] = useState<CategoryFormState>(() =>
    initialCategory ? loadCategoryToForm(initialCategory) : createInitialState()
  );
  const [categoryId, setCategoryId] = useState<string>(initialCategory?.id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (initialCategory) {
      setForm(loadCategoryToForm(initialCategory));
      setCategoryId(initialCategory.id);
    }
  }, [initialCategory]);

  const updateField = <K extends keyof CategoryFormState>(
    field: K,
    value: CategoryFormState[K]
  ) => {
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


    try {
      let translations;

      if (form.manualTranslationMode) {
        translations = SUPPORTED_LANGUAGES.map((item) => {
          const translation = form.translations[item.code];
          if (!translation.name) {
            throw new Error(`${item.label} adı zorunludur`);
          }

          return {
            languageCode: item.code,
            name: translation.name,
          };
        });
      } else {
        const trTranslation = form.translations.tr;
        if (!trTranslation.name) {
          throw new Error("Türkçe kategori adı zorunludur");
        }

        translations = [
          {
            languageCode: "tr" as const,
            name: trTranslation.name,
          },
        ];
      }

      const payload: AdminCategoryPayload | AdminUpdateCategoryPayload = mode === "update"
        ? {
            categoryId,
            slug: form.slug.trim() || undefined,
            translations,
          }
        : {
            slug: form.slug.trim() || undefined,
            translations,
          };

      setIsSubmitting(true);
      await onSubmit(payload, mode === "update" ? categoryId : undefined);
      setSuccess(
        mode === "create"
          ? form.manualTranslationMode
            ? "Kategori başarıyla oluşturuldu"
            : "Kategori başarıyla oluşturuldu ve çeviriler otomatik oluşturuldu"
          : form.manualTranslationMode
          ? "Kategori başarıyla güncellendi"
          : "Kategori başarıyla güncellendi ve çeviriler otomatik güncellendi"
      );
      if (mode === "create") {
        setForm(createInitialState());
        setCategoryId("");
      }
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
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      {mode === "update" && (
        <Input
          label="Kategori ID"
          value={categoryId}
          onValueChange={setCategoryId}
          variant="bordered"
          isRequired
          size="lg"
        />
      )}

      <Card className="dark:bg-[#1a1a1a]">
        <CardBody className="gap-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Temel Bilgiler
          </h3>
          <Input
            label="Slug (Opsiyonel - Otomatik oluşturulacak)"
            placeholder="ornek-kategori"
            value={form.slug}
            onValueChange={(value) => updateField("slug", value)}
            variant="bordered"
            size="lg"
          />
        </CardBody>
      </Card>

      <Card className="dark:bg-[#1a1a1a]">
        <CardBody className="gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Kategori Adları
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {form.manualTranslationMode
                  ? "Tüm diller için manuel çeviri girin"
                  : "Sadece Türkçe girin. İngilizce ve Lehçe çeviriler otomatik oluşturulacak."}
              </p>
            </div>
            <Checkbox
              isSelected={form.manualTranslationMode}
              onValueChange={(checked) => updateField("manualTranslationMode", checked)}
            >
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Manuel Çeviri
              </span>
            </Checkbox>
          </div>

          {form.manualTranslationMode ? (
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
                      size="lg"
                    />
                  </div>
                </Tab>
              ))}
            </Tabs>
          ) : (
            <Input
              label="Kategori Adı (Türkçe)"
              placeholder="Örn: Süt Ürünleri"
              value={form.translations.tr.name}
              onValueChange={(v) => updateTranslation("tr", "name", v)}
              variant="bordered"
              isRequired
              size="lg"
            />
          )}
        </CardBody>
      </Card>

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
          {mode === "create" ? "Kategori Oluştur" : "Kategoriyi Güncelle"}
        </Button>
      </div>
    </form>
  );
};
