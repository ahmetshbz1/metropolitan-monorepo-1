import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Spacer,
  Tab,
  Tabs,
  Image,
  Select,
  SelectItem,
} from "@heroui/react";
import { Save, Upload, X } from "lucide-react";

import { uploadProductImage } from "./api";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "./constants";
import type { AdminProductPayload } from "./types";
import { API_BASE_URL } from "../../config/env";
import { getCategories } from "../categories/api";
import type { AdminCategory } from "../categories/types";

interface TranslationState {
  name: string;
  fullName: string;
  description: string;
  allergens: string;
  badges: string;
  storageConditions: string;
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
  nutritionalValues: string;
  netQuantity: string;
  expiryDate: string;
  manufacturerInfo: string;
  originCountry: string;
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
  nutritionalValues: "",
  netQuantity: "",
  expiryDate: "",
  manufacturerInfo: "",
  originCountry: "",
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
      allergens: "",
      badges: "",
      storageConditions: "",
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
  initialProduct?: import("./types").AdminProduct;
}

const loadProductToForm = (product: import("./types").AdminProduct): ProductFormState => {
  return {
    productCode: product.productCode,
    categoryId: product.categoryId || "",
    brand: product.brand || "",
    size: product.size || "",
    imageUrl: product.imageUrl || "",
    price: product.price?.toString() || "",
    currency: product.currency,
    stock: product.stock.toString(),
    nutritionalValues: "",
    netQuantity: product.netQuantity || "",
    expiryDate: product.expiryDate
      ? new Date(product.expiryDate).toISOString().slice(0, 16)
      : "",
    manufacturerInfo: product.manufacturerInfo
      ? JSON.stringify(product.manufacturerInfo, null, 2)
      : "",
    originCountry: product.originCountry || "",
    individualPrice: product.individualPrice?.toString() || "",
    corporatePrice: product.corporatePrice?.toString() || "",
    minQuantityIndividual: product.minQuantityIndividual.toString(),
    minQuantityCorporate: product.minQuantityCorporate.toString(),
    quantityPerBox: product.quantityPerBox?.toString() || "",
    translations: {
      tr: {
        name: product.translations.tr.name,
        fullName: product.translations.tr.fullName || "",
        description: product.translations.tr.description || "",
        allergens: product.allergens?.join(", ") || "",
        badges: product.badges?.join(", ") || "",
        storageConditions: product.storageConditions || "",
      },
      en: {
        name: product.translations.en.name,
        fullName: product.translations.en.fullName || "",
        description: product.translations.en.description || "",
        allergens: "",
        badges: "",
        storageConditions: "",
      },
      pl: {
        name: product.translations.pl.name,
        fullName: product.translations.pl.fullName || "",
        description: product.translations.pl.description || "",
        allergens: "",
        badges: "",
        storageConditions: "",
      },
    },
  };
};

export const ProductForm = ({ mode, onSubmit, initialProduct }: ProductFormProps) => {
  const [form, setForm] = useState<ProductFormState>(() =>
    initialProduct ? loadProductToForm(initialProduct) : createInitialState()
  );
  const [productId, setProductId] = useState<string>(initialProduct?.productId || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await getCategories();
        setCategories(response.items);
      } catch (err) {
        console.error("Kategoriler yüklenemedi", err);
      }
    };
    loadCategories();
  }, []);

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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      setError(null);
      const imageUrl = await uploadProductImage(file);
      updateField("imageUrl", imageUrl);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Görsel yüklenemedi"
      );
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    updateField("imageUrl", "");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === "update" && productId.trim().length === 0) {
      setError("Ürün ID alanı zorunludur");
      return;
    }

    if (!form.productCode || form.productCode.trim().length < 2) {
      setError("Ürün kodu en az 2 karakter olmalıdır");
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

      const trTranslation = form.translations.tr;
      const allAllergens = parseArray(trTranslation.allergens);
      const allBadges = parseArray(trTranslation.badges);
      const allStorageConditions = trTranslation.storageConditions || undefined;

      const payload: AdminProductPayload = {
        productCode: form.productCode,
        categoryId: form.categoryId || undefined,
        brand: form.brand || undefined,
        size: form.size || undefined,
        imageUrl: form.imageUrl || undefined,
        price: parseNumber(form.price),
        currency: form.currency || undefined,
        stock: parseNumber(form.stock),
        allergens: allAllergens,
        nutritionalValues: parseJson(form.nutritionalValues),
        netQuantity: form.netQuantity || undefined,
        expiryDate: normalizeDate(form.expiryDate),
        storageConditions: allStorageConditions,
        manufacturerInfo: parseJson(form.manufacturerInfo),
        originCountry: form.originCountry || undefined,
        badges: allBadges,
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
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {mode === "update" && (
        <Input
          label="Ürün ID"
          placeholder="Ürün UUID değeri"
          value={productId}
          onValueChange={setProductId}
          variant="bordered"
          isRequired
        />
      )}

      <Tabs aria-label="Ürün formu" color="primary" variant="underlined">
        <Tab key="basic" title="Temel Bilgiler">
          <div className="flex flex-col gap-4 pt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Ürün Kodu"
                placeholder="ÜRÜN-001"
                value={form.productCode}
                onValueChange={(value) => updateField("productCode", value)}
                variant="bordered"
                isRequired
              />
              <Select
                label="Kategori"
                placeholder="Kategori seçin"
                selectedKeys={form.categoryId ? [form.categoryId] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  updateField("categoryId", selected || "");
                }}
                variant="bordered"
              >
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.translations.tr?.name || category.slug}
                  </SelectItem>
                ))}
              </Select>
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
              <div className="flex flex-col gap-3 md:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Ürün Görseli
                </label>
                {form.imageUrl ? (
                  <div className="relative inline-flex w-fit">
                    <Image
                      src={`${API_BASE_URL}${form.imageUrl}`}
                      alt="Ürün görseli"
                      width={200}
                      height={200}
                      className="rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="bordered"
                      startContent={<Upload className="h-4 w-4" />}
                      onPress={() => fileInputRef.current?.click()}
                      isLoading={isUploadingImage}
                    >
                      Görsel Yükle
                    </Button>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Max 5MB (JPEG, PNG, WebP)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Tab>

        <Tab key="pricing" title="Fiyatlandırma & Stok">
          <div className="flex flex-col gap-4 pt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                label="Koli Başına Adet"
                value={form.quantityPerBox}
                onValueChange={(value) => updateField("quantityPerBox", value)}
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
            </div>
          </div>
        </Tab>

        <Tab key="details" title="Ürün Detayları">
          <div className="flex flex-col gap-4 pt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Besin Değerleri (JSON)
              </label>
              <textarea
                className="min-h-[120px] rounded-medium border border-default-200 bg-white px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-0 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:text-slate-200"
                value={form.nutritionalValues}
                onChange={(event) =>
                  updateField("nutritionalValues", event.target.value)
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Üretici Bilgileri (JSON)
              </label>
              <textarea
                className="min-h-[120px] rounded-medium border border-default-200 bg-white px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-0 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:text-slate-200"
                value={form.manufacturerInfo}
                onChange={(event) =>
                  updateField("manufacturerInfo", event.target.value)
                }
              />
            </div>
          </div>
        </Tab>

        <Tab key="translations" title="Çeviriler">
          <div className="flex flex-col gap-4 pt-4">
            <Tabs aria-label="Diller" variant="bordered">
              {currentTranslations.map(({ code, label, value }) => (
                <Tab key={code} title={label}>
                  <div className="flex flex-col gap-4 pt-4">
                    <Input
                      label="Ürün Adı"
                      value={value.name}
                      onValueChange={(v) => updateTranslation(code, "name", v)}
                      variant="bordered"
                      isRequired
                    />
                    <Input
                      label="Tam Ad (Opsiyonel)"
                      value={value.fullName}
                      onValueChange={(v) => updateTranslation(code, "fullName", v)}
                      variant="bordered"
                    />
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Açıklama
                      </label>
                      <textarea
                        className="min-h-[100px] rounded-medium border border-default-200 bg-white px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-0 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:text-slate-200"
                        value={value.description}
                        onChange={(event) =>
                          updateTranslation(code, "description", event.target.value)
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Alerjenler (virgülle ayırınız)
                      </label>
                      <textarea
                        className="min-h-[80px] rounded-medium border border-default-200 bg-white px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-0 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:text-slate-200"
                        value={value.allergens}
                        onChange={(event) =>
                          updateTranslation(code, "allergens", event.target.value)
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Rozetler (virgülle ayırınız)
                      </label>
                      <textarea
                        className="min-h-[80px] rounded-medium border border-default-200 bg-white px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-0 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:text-slate-200"
                        value={value.badges}
                        onChange={(event) =>
                          updateTranslation(code, "badges", event.target.value)
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Saklama Koşulları
                      </label>
                      <textarea
                        className="min-h-[80px] rounded-medium border border-default-200 bg-white px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-0 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:text-slate-200"
                        value={value.storageConditions}
                        onChange={(event) =>
                          updateTranslation(code, "storageConditions", event.target.value)
                        }
                      />
                    </div>
                  </div>
                </Tab>
              ))}
            </Tabs>
          </div>
        </Tab>
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
          {mode === "create" ? "Ürünü Oluştur" : "Ürünü Güncelle"}
        </Button>
      </div>
    </form>
  );
};
