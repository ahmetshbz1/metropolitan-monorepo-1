import { useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Input,
  Spacer,
  Image,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { Save, Upload, X, Loader2 } from "lucide-react";

import { uploadProductImage } from "./api";
import type { AdminProductPayload } from "./types";
import { API_BASE_URL } from "../../config/env";
import { getCategories } from "../categories/api";
import type { AdminCategory } from "../categories/types";
import { KeyValueInput } from "./components/KeyValueInput";
import { TagInput } from "./components/TagInput";

interface ProductFormState {
  productCode: string;
  categoryId: string;
  brand: string;
  size: string;
  imageUrl: string;
  price: string;
  currency: string;
  stock: string;
  netQuantity: string;
  expiryDate: string;
  originCountry: string;
  individualPrice: string;
  corporatePrice: string;
  minQuantityIndividual: string;
  minQuantityCorporate: string;
  quantityPerBox: string;
  name: string;
  fullName: string;
  description: string;
  storageConditions: string;
  allergens: string[];
  badges: string[];
  nutritionalValues: Record<string, unknown>;
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
  netQuantity: "",
  expiryDate: "",
  originCountry: "",
  individualPrice: "",
  corporatePrice: "",
  minQuantityIndividual: "",
  minQuantityCorporate: "",
  quantityPerBox: "",
  name: "",
  fullName: "",
  description: "",
  storageConditions: "",
  allergens: [],
  badges: [],
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
    name: product.translations.tr.name,
    fullName: product.translations.tr.fullName || "",
    description: product.translations.tr.description || "",
    storageConditions: product.storageConditions || "",
    allergens: product.allergens || [],
    badges: product.badges || [],
    nutritionalValues: (product.nutritionalValues as Record<string, unknown>) || {},
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

    if (!form.name || form.name.trim().length === 0) {
      setError("Ürün adı zorunludur");
      return;
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
        allergens: form.allergens.length > 0 ? form.allergens : undefined,
        nutritionalValues: Object.keys(form.nutritionalValues).length > 0 ? form.nutritionalValues : undefined,
        netQuantity: form.netQuantity || undefined,
        expiryDate: normalizeDate(form.expiryDate),
        storageConditions: form.storageConditions || undefined,
        manufacturerInfo: Object.keys(form.manufacturerInfo).length > 0 ? form.manufacturerInfo : undefined,
        originCountry: form.originCountry || undefined,
        badges: form.badges.length > 0 ? form.badges : undefined,
        individualPrice: parseNumber(form.individualPrice),
        corporatePrice: parseNumber(form.corporatePrice),
        minQuantityIndividual: parseNumber(form.minQuantityIndividual),
        minQuantityCorporate: parseNumber(form.minQuantityCorporate),
        quantityPerBox: parseNumber(form.quantityPerBox),
        translations: [
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
      setSuccess(
        mode === "create"
          ? "Ürün başarıyla oluşturuldu ve çeviriler otomatik oluşturuldu"
          : "Ürün başarıyla güncellendi ve çeviriler otomatik güncellendi"
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
                  onClick={handleRemoveImage}
                  className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600"
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
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Ürün İçeriği (Türkçe)
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sadece Türkçe girin. İngilizce ve Lehçe çeviriler otomatik oluşturulacak.
          </p>
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

          <KeyValueInput
            label="Besin Değerleri"
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

          <TagInput
            label="Rozetler"
            value={form.badges}
            onChange={(value) => updateField("badges", value)}
            placeholder="Organik, Vegan, Glutensiz"
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
