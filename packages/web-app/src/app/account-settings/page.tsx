"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  useCurrentUser,
  useUpdateProfile,
  useUploadProfilePhoto,
} from "@/hooks/api/use-user";
import { useAuthStore } from "@/stores";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function AccountSettingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, accessToken, _hasHydrated } = useAuthStore();
  const { data: currentUser, isLoading } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const uploadPhoto = useUploadProfilePhoto();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // Initialize form when user data loads
  useEffect(() => {
    if (currentUser) {
      setFormData({
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
      });
    }
  }, [currentUser]);

  // Show loading state while hydrating
  if (!_hasHydrated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Icon icon="svg-spinners:ring-resize" className="size-12 text-primary" />
      </div>
    );
  }

  if (!accessToken || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Icon
            icon="solar:user-circle-line-duotone"
            className="size-16 text-muted-foreground mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold mb-2">Giriş Yapın</h2>
          <p className="text-muted-foreground mb-6">
            Hesap ayarlarınızı görmek için giriş yapmalısınız.
          </p>
          <Button asChild>
            <Link href="/auth/phone-login">Giriş Yap</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if anything changed
    if (
      formData.firstName === currentUser?.firstName &&
      formData.lastName === currentUser?.lastName &&
      formData.email === currentUser?.email
    ) {
      toast.info(t("toast.no_changes"));
      return;
    }

    try {
      await updateProfile.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      });
      toast.success(t("toast.profile_updated"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("toast.profile_update_failed"));
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dosya boyutu 5MB'dan küçük olmalıdır");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error(t("toast.only_images_allowed"));
      return;
    }

    try {
      await uploadPhoto.mutateAsync(file);
      toast.success(t("toast.profile_photo_updated"));
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || t("toast.photo_upload_failed")
      );
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormChanged =
    formData.firstName !== currentUser?.firstName ||
    formData.lastName !== currentUser?.lastName ||
    formData.email !== currentUser?.email;

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header - Compact */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full h-8 w-8"
          >
            <Icon icon="solar:arrow-left-line-duotone" className="size-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Hesap Ayarları</h1>
            <p className="text-xs text-muted-foreground">
              Profil bilgilerinizi ve ayarlarınızı yönetin
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          {/* Left Column - Profile Card - Compact */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border p-3 lg:sticky lg:top-6">
              <div className="flex flex-col items-center text-center">
                {/* Avatar - Compact */}
                <div className="relative group cursor-pointer mb-2">
                  <Avatar className="size-16">
                    <AvatarImage
                      src={currentUser?.profilePhotoUrl}
                      alt={currentUser?.firstName}
                    />
                    <AvatarFallback className="bg-primary/20">
                      <Icon
                        icon="solar:user-bold"
                        className="size-8 text-primary"
                      />
                    </AvatarFallback>
                  </Avatar>

                  {/* Camera Badge - Bottom Right */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadPhoto.isPending}
                    className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary shadow-lg flex items-center justify-center transform transition-transform hover:scale-110 disabled:opacity-50"
                  >
                    <Icon
                      icon={
                        uploadPhoto.isPending
                          ? "svg-spinners:ring-resize"
                          : "solar:camera-add-bold"
                      }
                      className="size-3 text-white"
                    />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>

                {/* Name & Badge - Compact */}
                <h3 className="text-sm font-semibold mb-0.5">
                  {currentUser?.firstName} {currentUser?.lastName}
                </h3>
                <Badge variant="secondary" className="text-xs mb-2">
                  {currentUser?.userType === "corporate"
                    ? "Kurumsal"
                    : t("user_types.individual")}
                </Badge>

                {/* Stats - Compact */}
                <div className="w-full grid grid-cols-2 gap-2">
                  <div className="bg-muted/50 rounded p-1.5">
                    <div className="text-base font-bold text-primary">0</div>
                    <div className="text-xs text-muted-foreground">
                      Sipariş
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded p-1.5">
                    <div className="text-base font-bold text-primary">0</div>
                    <div className="text-xs text-muted-foreground">
                      Favori
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Settings Forms - Compact */}
          <div className="space-y-4">
            {/* Profile Information */}
            <div className="bg-card rounded-lg border">
              <div className="p-4">
                <div className="mb-3">
                  <h2 className="text-sm font-semibold">Kişisel Bilgiler</h2>
                  <p className="text-xs text-muted-foreground">
                    Adınız, soyadınız ve email adresiniz
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Ad</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleChange("firstName", e.target.value)
                        }
                        placeholder={t("form.first_name_placeholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Soyad</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) =>
                          handleChange("lastName", e.target.value)
                        }
                        placeholder={t("form.last_name_placeholder")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Telefon numaranızı değiştirmek için destek ile iletişime
                      geçin
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={!isFormChanged || updateProfile.isPending}
                      className="flex-1"
                    >
                      {updateProfile.isPending ? (
                        <>
                          <Icon
                            icon="svg-spinners:ring-resize"
                            className="size-4 mr-2"
                          />
                          Kaydediliyor
                        </>
                      ) : (
                        <>
                          <Icon
                            icon="solar:check-circle-line-duotone"
                            className="size-4 mr-2"
                          />
                          Değişiklikleri Kaydet
                        </>
                      )}
                    </Button>
                    {isFormChanged && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setFormData({
                            firstName: currentUser?.firstName || "",
                            lastName: currentUser?.lastName || "",
                            email: currentUser?.email || "",
                            phone: currentUser?.phone || "",
                          });
                        }}
                      >
                        İptal
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Quick Links - Compact Grid */}
            <div className="bg-card rounded-lg border">
              <div className="p-4">
                <div className="mb-3">
                  <h2 className="text-sm font-semibold">Diğer Ayarlar</h2>
                  <p className="text-xs text-muted-foreground">
                    Güvenlik ve gizlilik ayarları
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Link
                    href="/addresses"
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors group border"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                      <Icon
                        icon="solar:map-point-line-duotone"
                        className="size-4 text-blue-600 dark:text-blue-400"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-xs">Adreslerim</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        Teslimat adresleri
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/security-settings"
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors group border"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                      <Icon
                        icon="solar:shield-check-line-duotone"
                        className="size-4 text-green-600 dark:text-green-400"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-xs">Güvenlik</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        Oturum yönetimi
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/privacy-settings"
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors group border"
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                      <Icon
                        icon="solar:eye-line-duotone"
                        className="size-4 text-purple-600 dark:text-purple-400"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-xs">Gizlilik</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        Veri tercihleri
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Danger Zone - Compact */}
            <div className="bg-card rounded-lg border border-red-200 dark:border-red-900/50">
              <div className="p-4">
                <div className="mb-3">
                  <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">
                    Tehlikeli Bölge
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Dikkatli olun, bu işlemler geri alınamaz
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Link
                    href="/export-data"
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group border"
                  >
                    <Icon
                      icon="solar:download-line-duotone"
                      className="size-4 text-muted-foreground flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-xs">Verilerimi İndir</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        Tüm verilerinizi indirin
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/delete-account"
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group border border-red-200 dark:border-red-900/50"
                  >
                    <Icon
                      icon="solar:trash-bin-trash-line-duotone"
                      className="size-4 text-red-600 dark:text-red-400 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-xs text-red-600 dark:text-red-400">
                        Hesabı Sil
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        Kalıcı olarak silin
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}