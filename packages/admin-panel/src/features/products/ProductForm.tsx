import { useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Spacer,
  Tab,
  Tabs,
} from "@heroui/react";

import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "./constants";
import type { AdminProductPayload } from "./types";

interface TranslationState {
  name: string;
  fullName: string;
  description: string;
}

interface ProductFormState {
  productCode: string;
  categoryId: string;
  brand: string;
  size: string;
  imageUrl: string;
  price: string;
  currency: string;
  stock: string;
  allergens: string;
  nutritionalValues: string;
  netQuantity: string;
  expiryDate: string;
  storageConditions: string;
  manufacturerInfo: string;
  originCountry: string;
  badges: string;
  individualPrice: string;
  corporatePrice: string;
  minQuantityIndividual: string;
  minQuantityCorporate: string;
  quantityPerBox: string;
  translations: Record<SupportedLanguage, TranslationState>;
}

const createInitialState = (): ProductFormState => ({
  productCode: "",
  categoryId: "",
  brand: "",
  size: "",
  imageUrl: "",
  price: "",
  currency: "PLN",
  stock: "",
  allergens: "",
  nutritionalValues: "",
  netQuantity: "",
  expiryDate: "",
  storageConditions: "",
  manufacturerInfo: "",
  originCountry: "",
  badges: "",
  individualPrice: "",
  corporatePrice: "",
  minQuantityIndividual: "",
  minQuantityCorporate: "",
  quantityPerBox: "",
  translations: SUPPORTED_LANGUAGES.reduce((acc, item) => {
    acc[item.code] = {
      name: "",
      fullName: "",
      description: "",
    };
    return acc;
  }, {} as Record<SupportedLanguage, TranslationState>),
});

const parseNumber = (value: string): number | undefined => {
  if (!value) return undefined;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error("Sayısal alanlar için geçerli bir değer giriniz");
  }
  return parsed;
};

const parseArray = (value: string): string[] | undefined =>
  value ? value.split(",").map((item) => item.trim()).filter(Boolean) : undefined;

const parseJson = (value: string): Record<string, unknown> | undefined => {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error();
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new Error("JSON alanı için geçerli bir nesne giriniz");
  }
};

const normalizeDate = (value: string): string | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Geçerli bir tarih seçiniz");
  }
  return date.toISOString();
};

interface ProductFormProps {
  mode: "create" | "update";
  onSubmit: (payload: AdminProductPayload, productId?: string) => Promise<void>;
}

export const ProductForm = ({ mode, onSubmit }: ProductFormProps) => {
  const [form, setForm] = useState<ProductFormState>(() => createInitialState());
  const [productId, setProductId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const currentTranslations = useMemo(
    () => SUPPORTED_LANGUAGES.map((item) => ({
      ...item,
      value: form.translations[item.code],
    })),
    [form.translations]
  );

  const updateField = (field: keyof ProductFormState, value: string) => {
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

  const resetForm = () => {
    setForm(createInitialState());
    if (mode === "update") {
      setProductId("");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === "update" && productId.trim().length === 0) {
      setError("Ürün ID alanı zorunludur");
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
          fullName: translation.fullName || undefined,
          description: translation.description || undefined,
        };
      });

      const payload: AdminProductPayload = {
        productCode: form.productCode,
        categoryId: form.categoryId || undefined,
        brand: form.brand || undefined,
        size: form.size || undefined,
        imageUrl: form.imageUrl || undefined,
        price: parseNumber(form.price),
        currency: form.currency || undefined,
        stock: parseNumber(form.stock),
        allergens: parseArray(form.allergens),
        nutritionalValues: parseJson(form.nutritionalValues),
        netQuantity: form.netQuantity || undefined,
        expiryDate: normalizeDate(form.expiryDate),
        storageConditions: form.storageConditions || undefined,
        manufacturerInfo: parseJson(form.manufacturerInfo),
        originCountry: form.originCountry || undefined,
        badges: parseArray(form.badges),
        individualPrice: parseNumber(form.individualPrice),
        corporatePrice: parseNumber(form.corporatePrice),
        minQuantityIndividual: parseNumber(form.minQuantityIndividual),
        minQuantityCorporate: parseNumber(form.minQuantityCorporate),
        quantityPerBox: parseNumber(form.quantityPerBox),
        translations,
      };

      setIsSubmitting(true);
      await onSubmit(payload, mode === "update" ? productId : undefined);
      setSuccess(
        mode === "create"
          ? "Ürün başarıyla oluşturuldu"
          : "Ürün başarıyla güncellendi"
      );
      resetForm();
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
    <Card className="w-full">
      <CardHeader className="flex flex-col items-start gap-2 pb-0">
        <h3 className="text-xl font-semibold text-slate-900">
          {mode === "create" ? "Yeni Ürün Ekle" : "Ürün Güncelle"}
        </h3>
        <p className="text-sm text-default-500">
          Tüm alanları doldurarak çok dilli ürün yönetimi yapabilirsiniz.
        </p>
      </CardHeader>
      <CardBody>
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          {mode === "update" ? (
            <Input
              label="Ürün ID"
              placeholder="Ürün UUID değeri"
              value={productId}
              onValueChange={setProductId}
              variant="bordered"
              isRequired
            />
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Ürün Kodu"
              placeholder="ÜRÜN-001"
              value={form.productCode}
              onValueChange={(value) => updateField("productCode", value)}
              variant="bordered"
              isRequired
            />
            <Input
              label="Kategori ID"
              placeholder="Opsiyonel"
              value={form.categoryId}
              onValueChange={(value) => updateField("categoryId", value)}
              variant="bordered"
            />
            <Input
              label="Marka"
              value={form.brand}
              onValueChange={(value) => updateField("brand", value)}
              variant="bordered"
            />
            <Input
              label="Boyut"
              value={form.size}
              onValueChange={(value) => updateField("size", value)}
              variant="bordered"
            />
            <Input
              label="Görsel URL"
              value={form.imageUrl}
              onValueChange={(value) => updateField("imageUrl", value)}
              variant="bordered"
            />
            <Input
              label="Fiyat"
              placeholder="Örn. 49.99"
              value={form.price}
              onValueChange={(value) => updateField("price", value)}
              variant="bordered"
            />
            <Input
              label="Para Birimi"
              value={form.currency}
              onValueChange={(value) => updateField("currency", value)}
              variant="bordered"
              maxLength={3}
            />
            <Input
              label="Stok"
              value={form.stock}
              onValueChange={(value) => updateField("stock", value)}
              variant="bordered"
            />
            <Input
              label="Bireysel Fiyat"
              value={form.individualPrice}
              onValueChange={(value) => updateField("individualPrice", value)}
              variant="bordered"
            />
            <Input
              label="Kurumsal Fiyat"
              value={form.corporatePrice}
              onValueChange={(value) => updateField("corporatePrice", value)}
              variant="bordered"
            />
            <Input
              label="Bireysel Minimum Adet"
              value={form.minQuantityIndividual}
              onValueChange={(value) =>
                updateField("minQuantityIndividual", value)
              }
              variant="bordered"
            />
            <Input
              label="Kurumsal Minimum Adet"
              value={form.minQuantityCorporate}
              onValueChange={(value) =>
                updateField("minQuantityCorporate", value)
              }
              variant="bordered"
            />
            <Input
              label="Koli Başına Adet"
              value={form.quantityPerBox}
              onValueChange={(value) => updateField("quantityPerBox", value)}
              variant="bordered"
            />
            <Input
              label="Net Miktar"
              value={form.netQuantity}
              onValueChange={(value) => updateField("netQuantity", value)}
              variant="bordered"
            />
            <Input
              label="Son Kullanma Tarihi"
              type="datetime-local"
              value={form.expiryDate}
              onValueChange={(value) => updateField("expiryDate", value)}
              variant="bordered"
            />
            <Input
              label="Menşe Ülke"
              value={form.originCountry}
              onValueChange={(value) => updateField("originCountry", value)}
              variant="bordered"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">
                Alerjenler (virgülle ayırınız)
              </label>
              <textarea
                className="min-h-[80px] rounded-medium border border-default-200 bg-white px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-0"
                value={form.allergens}
                onChange={(event) =>
                  updateField("allergens", event.target.value)
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">
                Rozetler (virgülle ayırınız)
              </label>
              <textarea
                className="min-h-[80px] rounded-medium border border-default-200 bg-white px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-0"
                value={form.badges}
                onChange={(event) => updateField("badges", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">
                Besin Değerleri (JSON)
              </label>
              <textarea
                className="min-h-[120px] rounded-medium border border-default-200 bg-white px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-0"
                value={form.nutritionalValues}
                onChange={(event) =>
                  updateField("nutritionalValues", event.target.value)
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">
                Üretici Bilgileri (JSON)
              </label>
              <textarea
                className="min-h-[120px] rounded-medium border border-default-200 bg-white px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-0"
                value={form.manufacturerInfo}
                onChange={(event) =>
                  updateField("manufacturerInfo", event.target.value)
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">
              Saklama Koşulları
            </label>
            <textarea
              className="min-h-[80px] rounded-medium border border-default-200 bg-white px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-0"
              value={form.storageConditions}
              onChange={(event) =>
                updateField("storageConditions", event.target.value)
              }
            />
          </div>

          <Tabs className="w-full" aria-label="Ürün çevirileri">
            {currentTranslations.map(({ code, label, value }) => (
              <Tab key={code} title={label} className="pt-4">
                <div className="flex flex-col gap-4">
                  <Input
                    label="Ad"
                    value={value.name}
                    onValueChange={(v) => updateTranslation(code, "name", v)}
                    variant="bordered"
                    isRequired
                  />
                  <Input
                    label="Tam Ad"
                    value={value.fullName}
                    onValueChange={(v) => updateTranslation(code, "fullName", v)}
                    variant="bordered"
                  />
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700">
                      Açıklama
                    </label>
                    <textarea
                      className="min-h-[120px] rounded-medium border border-default-200 bg-white px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-0"
                      value={value.description}
                      onChange={(event) =>
                        updateTranslation(code, "description", event.target.value)
                      }
                    />
                  </div>
                </div>
              </Tab>
            ))}
          </Tabs>

          {error ? (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          ) : null}

          {success ? (
            <p className="text-sm text-green-600" role="status">
              {success}
            </p>
          ) : null}

          <Spacer y={1} />
          <Button
            color="primary"
            type="submit"
            isLoading={isSubmitting}
            className="self-start"
          >
            {mode === "create" ? "Ürünü Oluştur" : "Ürünü Güncelle"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
};
