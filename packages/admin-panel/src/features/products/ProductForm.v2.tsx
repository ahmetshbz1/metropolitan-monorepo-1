import { useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Input,
  Image,
  Select,
  SelectItem,
  Textarea,
  Checkbox,
  Tabs,
  Tab,
  Spacer,
} from "@heroui/react";
import { Save, Upload, X, Loader2 } from "lucide-react";

import { deleteProductImage, uploadProductImage } from "./api";
import type { AdminProductPayload } from "./types";
import { API_BASE_URL } from "../../config/env";
import { getCategories } from "../categories/api";
import type { AdminCategory } from "../categories/types";
import { KeyValueInput } from "./components/KeyValueInput";
import { TagInput } from "./components/TagInput";
import { NutritionalValuesInput } from "./components/NutritionalValuesInput";
import { BadgesInput } from "./components/BadgesInput";
import { taxRateToString, validateTaxRate } from "../../types/product.types";

interface ProductFormState {
  productCode: string;
  categoryId: string;
  brand: string;
  size: string;
  imageUrl: string;
  price: string;
  currency: string;
  stock: string;
  tax: string;
  netQuantity: string;
  expiryDate: string;
  originCountry: string;
  individualPrice: string;
  corporatePrice: string;
  minQuantityIndividual: string;
  minQuantityCorporate: string;
  quantityPerBox: string;
  manualTranslationMode: boolean;
  name: string;
  fullName: string;
  description: string;
  nameEn: string;
  fullNameEn: string;
  descriptionEn: string;
  namePl: string;
  fullNamePl: string;
  descriptionPl: string;
  storageConditions: string;
  allergens: string[];
  badges: {
    halal?: boolean;
    vegetarian?: boolean;
    vegan?: boolean;
    glutenFree?: boolean;
    organic?: boolean;
    lactoseFree?: boolean;
  };
  nutritionalValues: {
    energy?: string;
    fat?: string;
    saturatedFat?: string;
    carbohydrates?: string;
    sugar?: string;
    protein?: string;
    salt?: string;
  };
  manufacturerInfo: Record<string, unknown>;
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
  tax: "23",
  netQuantity: "",
  expiryDate: "",
  originCountry: "",
  individualPrice: "",
  corporatePrice: "",
  minQuantityIndividual: "",
  minQuantityCorporate: "",
  quantityPerBox: "",
  manualTranslationMode: true,
  name: "",
  fullName: "",
  description: "",
  nameEn: "",
  fullNameEn: "",
  descriptionEn: "",
  namePl: "",
  fullNamePl: "",
  descriptionPl: "",
  storageConditions: "",
  allergens: [],
  badges: {},
  nutritionalValues: {},
  manufacturerInfo: {},
});

const parseNumber = (value: string): number | undefined => {
  if (!value) return undefined;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error("Sayısal alanlar için geçerli bir değer giriniz");
  }
  return parsed;
};

const normalizeDate = (value: string): string | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Geçerli bir tarih seçiniz");
  }
  return date.toISOString();
};

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
    tax: taxRateToString(product.tax),
    netQuantity: product.netQuantity || "",
    expiryDate: product.expiryDate
      ? new Date(product.expiryDate).toISOString().slice(0, 16)
      : "",
    originCountry: product.originCountry || "",
    individualPrice: product.individualPrice?.toString() || "",
    corporatePrice: product.corporatePrice?.toString() || "",
    minQuantityIndividual: product.minQuantityIndividual.toString(),
    minQuantityCorporate: product.minQuantityCorporate.toString(),
    quantityPerBox: product.quantityPerBox?.toString() || "",
    manualTranslationMode: false,
    name: product.translations.tr.name,
    fullName: product.translations.tr.fullName || "",
    description: product.translations.tr.description || "",
    nameEn: product.translations.en.name || "",
    fullNameEn: product.translations.en.fullName || "",
    descriptionEn: product.translations.en.description || "",
    namePl: product.translations.pl.name || "",
    fullNamePl: product.translations.pl.fullName || "",
    descriptionPl: product.translations.pl.description || "",
    storageConditions: product.storageConditions || "",
    allergens: product.allergens || [],
    badges: (product.badges as ProductFormState["badges"]) || {},
    nutritionalValues: (product.nutritionalValues as ProductFormState["nutritionalValues"]) || {},
    manufacturerInfo: (product.manufacturerInfo as Record<string, unknown>) || {},
  };
};

interface ProductFormProps {
  mode: "create" | "update";
  onSubmit: (payload: AdminProductPayload, productId?: string) => Promise<void>;
  initialProduct?: import("./types").AdminProduct;
}

export const ProductFormV2 = ({ mode, onSubmit, initialProduct }: ProductFormProps) => {
  const [form, setForm] = useState<ProductFormState>(() =>
    initialProduct ? loadProductToForm(initialProduct) : createInitialState()
  );
  const [productId, setProductId] = useState<string>(initialProduct?.productId || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
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

  const updateField = <K extends keyof ProductFormState>(
    field: K,
    value: ProductFormState[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
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

  const handleRemoveImage = async () => {
    if (!form.imageUrl || isDeletingImage) return;

    try {
      setIsDeletingImage(true);
      setError(null);
      await deleteProductImage(form.imageUrl);
      updateField("imageUrl", "");
    } catch (error) {
      console.error("Görsel silinirken hata oluştu:", error);
      setError(error instanceof Error ? error.message : "Görsel silinemedi");
    } finally {
      setIsDeletingImage(false);
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

    if (!form.productCode || form.productCode.trim().length < 2) {
      setError("Ürün kodu en az 2 karakter olmalıdır");
      return;
    }

    if (!form.name || form.name.trim().length === 0) {
      setError("Ürün adı (Türkçe) zorunludur");
      return;
    }

    if (form.manualTranslationMode) {
      if (!form.nameEn || form.nameEn.trim().length === 0) {
        setError("Ürün adı (İngilizce) zorunludur");
        return;
      }
      if (!form.namePl || form.namePl.trim().length === 0) {
        setError("Ürün adı (Lehçe) zorunludur");
        return;
      }
    }

    try {
      const payload: AdminProductPayload = {
        productCode: form.productCode,
        categoryId: form.categoryId || undefined,
        brand: form.brand || undefined,
        size: form.size || undefined,
        imageUrl: form.imageUrl || undefined,
        price: parseNumber(form.price),
        currency: form.currency || undefined,
        stock: parseNumber(form.stock),
        tax: validateTaxRate(form.tax),
        allergens: form.allergens.length > 0 ? form.allergens : undefined,
        nutritionalValues: Object.keys(form.nutritionalValues).length > 0 ? form.nutritionalValues : undefined,
        netQuantity: form.netQuantity || undefined,
        expiryDate: normalizeDate(form.expiryDate),
        storageConditions: form.storageConditions || undefined,
        manufacturerInfo: Object.keys(form.manufacturerInfo).length > 0 ? form.manufacturerInfo : undefined,
        originCountry: form.originCountry || undefined,
        badges: Object.keys(form.badges).length > 0 ? form.badges : undefined,
        individualPrice: parseNumber(form.individualPrice),
        corporatePrice: parseNumber(form.corporatePrice),
        minQuantityIndividual: parseNumber(form.minQuantityIndividual),
        minQuantityCorporate: parseNumber(form.minQuantityCorporate),
        quantityPerBox: parseNumber(form.quantityPerBox),
        translations: form.manualTranslationMode
          ? [
              {
                languageCode: "tr",
                name: form.name,
                fullName: form.fullName || undefined,
                description: form.description || undefined,
              },
              {
                languageCode: "en",
                name: form.nameEn,
                fullName: form.fullNameEn || undefined,
                description: form.descriptionEn || undefined,
              },
              {
                languageCode: "pl",
                name: form.namePl,
                fullName: form.fullNamePl || undefined,
                description: form.descriptionPl || undefined,
              },
            ]
          : [
              {
                languageCode: "tr",
                name: form.name,
                fullName: form.fullName || undefined,
                description: form.description || undefined,
              },
            ],
      };

      setIsSubmitting(true);
      await onSubmit(payload, mode === "update" ? productId : undefined);

      // Update modda form değerlerini payload'dan koru (özellikle tax)
      if (mode === "update") {
        if (payload.tax !== undefined && payload.tax !== null) {
          updateField("tax", payload.tax.toString());
        }
      }

      setSuccess(
        mode === "create"
          ? form.manualTranslationMode
            ? "Ürün başarıyla oluşturuldu"
            : "Ürün başarıyla oluşturuldu ve çeviriler otomatik oluşturuldu"
          : form.manualTranslationMode
          ? "Ürün başarıyla güncellendi"
          : "Ürün başarıyla güncellendi ve çeviriler otomatik güncellendi"
      );

      // Create modda formu resetle
      if (mode === "create") {
        resetForm();
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
          label="Ürün ID"
          placeholder="Ürün UUID değeri"
          value={productId}
          onValueChange={setProductId}
          variant="bordered"
          isRequired
          size="lg"
        />
      )}

      <Card className="dark:bg-[#1a1a1a]">
        <CardBody className="gap-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Temel Bilgiler
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Ürün Kodu"
              placeholder="ÜRÜN-001"
              value={form.productCode}
              onValueChange={(value) => updateField("productCode", value)}
              variant="bordered"
              isRequired
              size="lg"
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
              size="lg"
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
              size="lg"
            />
            <Input
              label="Boyut"
              value={form.size}
              onValueChange={(value) => updateField("size", value)}
              variant="bordered"
              size="lg"
            />
          </div>

          <div className="flex flex-col gap-3">
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
                  onClick={() => void handleRemoveImage()}
                  disabled={isDeletingImage}
                  className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeletingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
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
                  startContent={isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  onPress={() => fileInputRef.current?.click()}
                  isDisabled={isUploadingImage}
                  size="lg"
                >
                  {isUploadingImage ? "Yükleniyor..." : "Görsel Yükle"}
                </Button>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Max 5MB (JPEG, PNG, WebP)
                </span>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <Card className="dark:bg-[#1a1a1a]">
        <CardBody className="gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Ürün İçeriği
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
              <Tab key="tr" title="Türkçe">
                <div className="flex flex-col gap-4 pt-4">
                  <Input
                    label="Ürün Adı"
                    placeholder="Örn: Tam Yağlı Süt"
                    value={form.name}
                    onValueChange={(value) => updateField("name", value)}
                    variant="bordered"
                    isRequired
                    size="lg"
                  />
                  <Input
                    label="Tam Ad (Opsiyonel)"
                    placeholder="Örn: Yayla Tam Yağlı Süt 1L"
                    value={form.fullName}
                    onValueChange={(value) => updateField("fullName", value)}
                    variant="bordered"
                    size="lg"
                  />
                  <Textarea
                    label="Açıklama"
                    placeholder="Ürün açıklaması..."
                    value={form.description}
                    onValueChange={(value) => updateField("description", value)}
                    variant="bordered"
                    minRows={3}
                    size="lg"
                  />
                  <Textarea
                    label="Saklama Koşulları"
                    placeholder="Örn: Serin ve kuru yerde saklayınız"
                    value={form.storageConditions}
                    onValueChange={(value) => updateField("storageConditions", value)}
                    variant="bordered"
                    minRows={2}
                    size="lg"
                  />
                </div>
              </Tab>
              <Tab key="en" title="English">
                <div className="flex flex-col gap-4 pt-4">
                  <Input
                    label="Product Name"
                    placeholder="e.g: Whole Milk"
                    value={form.nameEn}
                    onValueChange={(value) => updateField("nameEn", value)}
                    variant="bordered"
                    isRequired
                    size="lg"
                  />
                  <Input
                    label="Full Name (Optional)"
                    placeholder="e.g: Yayla Whole Milk 1L"
                    value={form.fullNameEn}
                    onValueChange={(value) => updateField("fullNameEn", value)}
                    variant="bordered"
                    size="lg"
                  />
                  <Textarea
                    label="Description"
                    placeholder="Product description..."
                    value={form.descriptionEn}
                    onValueChange={(value) => updateField("descriptionEn", value)}
                    variant="bordered"
                    minRows={3}
                    size="lg"
                  />
                </div>
              </Tab>
              <Tab key="pl" title="Polski">
                <div className="flex flex-col gap-4 pt-4">
                  <Input
                    label="Nazwa produktu"
                    placeholder="np: Mleko pełnotłuste"
                    value={form.namePl}
                    onValueChange={(value) => updateField("namePl", value)}
                    variant="bordered"
                    isRequired
                    size="lg"
                  />
                  <Input
                    label="Pełna nazwa (Opcjonalnie)"
                    placeholder="np: Yayla Mleko pełnotłuste 1L"
                    value={form.fullNamePl}
                    onValueChange={(value) => updateField("fullNamePl", value)}
                    variant="bordered"
                    size="lg"
                  />
                  <Textarea
                    label="Opis"
                    placeholder="Opis produktu..."
                    value={form.descriptionPl}
                    onValueChange={(value) => updateField("descriptionPl", value)}
                    variant="bordered"
                    minRows={3}
                    size="lg"
                  />
                </div>
              </Tab>
            </Tabs>
          ) : (
            <div className="flex flex-col gap-4">
              <Input
                label="Ürün Adı (Türkçe)"
                placeholder="Örn: Tam Yağlı Süt"
                value={form.name}
                onValueChange={(value) => updateField("name", value)}
                variant="bordered"
                isRequired
                size="lg"
              />
              <Input
                label="Tam Ad (Opsiyonel)"
                placeholder="Örn: Yayla Tam Yağlı Süt 1L"
                value={form.fullName}
                onValueChange={(value) => updateField("fullName", value)}
                variant="bordered"
                size="lg"
              />
              <Textarea
                label="Açıklama"
                placeholder="Ürün açıklaması..."
                value={form.description}
                onValueChange={(value) => updateField("description", value)}
                variant="bordered"
                minRows={3}
                size="lg"
              />
              <Textarea
                label="Saklama Koşulları"
                placeholder="Örn: Serin ve kuru yerde saklayınız"
                value={form.storageConditions}
                onValueChange={(value) => updateField("storageConditions", value)}
                variant="bordered"
                minRows={2}
                size="lg"
              />
            </div>
          )}
        </CardBody>
      </Card>

      <Card className="dark:bg-[#1a1a1a]">
        <CardBody className="gap-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Fiyatlandırma & Stok
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Fiyat"
              placeholder="49.99"
              value={form.price}
              onValueChange={(value) => updateField("price", value)}
              variant="bordered"
              size="lg"
            />
            <Input
              label="Para Birimi"
              value={form.currency}
              onValueChange={(value) => updateField("currency", value)}
              variant="bordered"
              maxLength={3}
              size="lg"
            />
            <Input
              label="Stok"
              value={form.stock}
              onValueChange={(value) => updateField("stock", value)}
              variant="bordered"
              size="lg"
            />
            <Select
              label="VAT Oranı (%)"
              placeholder="VAT seçin"
              selectedKeys={form.tax ? [form.tax] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                updateField("tax", selected || "");
              }}
              variant="bordered"
              size="lg"
              description="Polonya PTU oranı"
              isRequired
            >
              <SelectItem key="0" value="0">0%</SelectItem>
              <SelectItem key="5" value="5">5%</SelectItem>
              <SelectItem key="7" value="7">7%</SelectItem>
              <SelectItem key="8" value="8">8%</SelectItem>
              <SelectItem key="23" value="23">23%</SelectItem>
            </Select>
            <Input
              label="Bireysel Fiyat"
              value={form.individualPrice}
              onValueChange={(value) => updateField("individualPrice", value)}
              variant="bordered"
              size="lg"
            />
            <Input
              label="Kurumsal Fiyat"
              value={form.corporatePrice}
              onValueChange={(value) => updateField("corporatePrice", value)}
              variant="bordered"
              size="lg"
            />
            <Input
              label="Koli Başına Adet"
              value={form.quantityPerBox}
              onValueChange={(value) => updateField("quantityPerBox", value)}
              variant="bordered"
              size="lg"
            />
            <Input
              label="Bireysel Min Adet"
              value={form.minQuantityIndividual}
              onValueChange={(value) =>
                updateField("minQuantityIndividual", value)
              }
              variant="bordered"
              size="lg"
            />
            <Input
              label="Kurumsal Min Adet"
              value={form.minQuantityCorporate}
              onValueChange={(value) =>
                updateField("minQuantityCorporate", value)
              }
              variant="bordered"
              size="lg"
            />
          </div>
        </CardBody>
      </Card>

      <Card className="dark:bg-[#1a1a1a]">
        <CardBody className="gap-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Ürün Detayları
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Net Miktar"
              placeholder="500g, 1L"
              value={form.netQuantity}
              onValueChange={(value) => updateField("netQuantity", value)}
              variant="bordered"
              size="lg"
            />
            <Input
              label="Son Kullanma Tarihi"
              type="datetime-local"
              value={form.expiryDate}
              onValueChange={(value) => updateField("expiryDate", value)}
              variant="bordered"
              size="lg"
            />
            <Input
              label="Menşe Ülke"
              placeholder="Türkiye"
              value={form.originCountry}
              onValueChange={(value) => updateField("originCountry", value)}
              variant="bordered"
              size="lg"
            />
          </div>

          <Spacer y={2} />

          <NutritionalValuesInput
            value={form.nutritionalValues}
            onChange={(value) => updateField("nutritionalValues", value)}
          />

          <KeyValueInput
            label="Üretici Bilgileri"
            value={form.manufacturerInfo}
            onChange={(value) => updateField("manufacturerInfo", value)}
          />

          <TagInput
            label="Alerjenler"
            value={form.allergens}
            onChange={(value) => updateField("allergens", value)}
            placeholder="Süt, Yumurta, Fıstık"
          />

          <BadgesInput
            value={form.badges}
            onChange={(value) => updateField("badges", value)}
          />
        </CardBody>
      </Card>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950/50">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950/50">
          <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button
          color="primary"
          type="submit"
          isLoading={isSubmitting}
          startContent={!isSubmitting && <Save className="h-4 w-4" />}
          size="lg"
        >
          {isSubmitting
            ? "Kaydediliyor..."
            : mode === "create"
            ? "Ürünü Oluştur"
            : "Ürünü Güncelle"}
        </Button>
      </div>
    </form>
  );
};
