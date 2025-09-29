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
      toast.info("Değişiklik yapılmadı");
      return;
    }

    try {
      await updateProfile.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      });
      toast.success("Profil güncellendi");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Profil güncellenemedi");
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
      toast.error("Sadece resim dosyaları yüklenebilir");
      return;
    }

    try {
      await uploadPhoto.mutateAsync(file);
      toast.success("Profil fotoğrafı güncellendi");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Fotoğraf yüklenemedi"
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
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <Icon icon="solar:arrow-left-line-duotone" className="size-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Hesap Ayarları</h1>
            <p className="text-sm text-muted-foreground">
              Profil bilgilerinizi ve ayarlarınızı yönetin
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl border border-border p-6 sticky top-8">
              <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="relative group cursor-pointer mb-4">
                  <Avatar className="size-24">
                    <AvatarImage
                      src={currentUser?.profilePhotoUrl}
                      alt={currentUser?.firstName}
                    />
                    <AvatarFallback className="bg-primary/20">
                      <Icon
                        icon="solar:user-bold"
                        className="size-12 text-primary"
                      />
                    </AvatarFallback>
                  </Avatar>

                  {/* Camera Badge - Bottom Right */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadPhoto.isPending}
                    className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary shadow-lg flex items-center justify-center transform transition-transform hover:scale-110 disabled:opacity-50"
                  >
                    <Icon
                      icon={
                        uploadPhoto.isPending
                          ? "svg-spinners:ring-resize"
                          : "solar:camera-add-bold"
                      }
                      className="size-5 text-white"
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

                {/* Name & Badge */}
                <h3 className="text-xl font-semibold mb-1">
                  {currentUser?.firstName} {currentUser?.lastName}
                </h3>
                <Badge variant="secondary" className="mb-3">
                  {currentUser?.userType === "corporate"
                    ? "Kurumsal"
                    : "Bireysel"}
                </Badge>

                {/* Stats */}
                <div className="w-full grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-primary">0</div>
                    <div className="text-xs text-muted-foreground">
                      Siparişler
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-primary">0</div>
                    <div className="text-xs text-muted-foreground">
                      Favoriler
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Settings Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <div className="bg-card rounded-2xl border border-border">
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold">Kişisel Bilgiler</h2>
                  <p className="text-sm text-muted-foreground">
                    Adınız, soyadınız ve email adresiniz
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Ad</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleChange("firstName", e.target.value)
                        }
                        placeholder="Adınız"
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
                        placeholder="Soyadınız"
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

            {/* Quick Links */}
            <div className="bg-card rounded-2xl border border-border">
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold">Diğer Ayarlar</h2>
                  <p className="text-sm text-muted-foreground">
                    Güvenlik ve gizlilik ayarları
                  </p>
                </div>

                <div className="space-y-2">
                  <Link
                    href="/addresses"
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <Icon
                        icon="solar:map-point-line-duotone"
                        className="size-5 text-blue-600 dark:text-blue-400"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">Adreslerim</h3>
                      <p className="text-sm text-muted-foreground">
                        Teslimat ve fatura adreslerini yönet
                      </p>
                    </div>
                    <Icon
                      icon="solar:alt-arrow-right-line-duotone"
                      className="size-5 text-muted-foreground group-hover:translate-x-1 transition-transform"
                    />
                  </Link>

                  <Separator />

                  <Link
                    href="/security-settings"
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <Icon
                        icon="solar:shield-check-line-duotone"
                        className="size-5 text-green-600 dark:text-green-400"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">Güvenlik</h3>
                      <p className="text-sm text-muted-foreground">
                        Şifre ve oturum yönetimi
                      </p>
                    </div>
                    <Icon
                      icon="solar:alt-arrow-right-line-duotone"
                      className="size-5 text-muted-foreground group-hover:translate-x-1 transition-transform"
                    />
                  </Link>

                  <Separator />

                  <Link
                    href="/privacy-settings"
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                      <Icon
                        icon="solar:eye-line-duotone"
                        className="size-5 text-purple-600 dark:text-purple-400"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">Gizlilik</h3>
                      <p className="text-sm text-muted-foreground">
                        Veri ve gizlilik tercihleri
                      </p>
                    </div>
                    <Icon
                      icon="solar:alt-arrow-right-line-duotone"
                      className="size-5 text-muted-foreground group-hover:translate-x-1 transition-transform"
                    />
                  </Link>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-card rounded-2xl border border-red-200 dark:border-red-900/50">
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
                    Tehlikeli Bölge
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Dikkatli olun, bu işlemler geri alınamaz
                  </p>
                </div>

                <div className="space-y-2">
                  <Link
                    href="/export-data"
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group"
                  >
                    <Icon
                      icon="solar:download-line-duotone"
                      className="size-5 text-muted-foreground"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">Verilerimi İndir</h3>
                      <p className="text-sm text-muted-foreground">
                        Tüm kişisel verilerinizi indirin
                      </p>
                    </div>
                    <Icon
                      icon="solar:alt-arrow-right-line-duotone"
                      className="size-5 text-muted-foreground group-hover:translate-x-1 transition-transform"
                    />
                  </Link>

                  <Separator />

                  <Link
                    href="/delete-account"
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group"
                  >
                    <Icon
                      icon="solar:trash-bin-trash-line-duotone"
                      className="size-5 text-red-600 dark:text-red-400"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-red-600 dark:text-red-400">
                        Hesabı Sil
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Hesabınızı kalıcı olarak silin
                      </p>
                    </div>
                    <Icon
                      icon="solar:alt-arrow-right-line-duotone"
                      className="size-5 text-red-600 dark:text-red-400 group-hover:translate-x-1 transition-transform"
                    />
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