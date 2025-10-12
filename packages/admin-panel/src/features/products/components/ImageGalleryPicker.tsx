import { useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Image,
  Spinner,
  Checkbox,
} from "@heroui/react";
import { Check, Trash2, Upload, X } from "lucide-react";

import { getProductImages, uploadProductImage, deleteProductImage } from "../api";
import type { ProductImageInfo } from "../types";
import { API_BASE_URL } from "../../../config/env";
import { useConfirm } from "../../../hooks/useConfirm";
import { useToast } from "../../../hooks/useToast";

interface ImageGalleryPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  currentImageUrl?: string;
}

export const ImageGalleryPicker = ({
  isOpen,
  onClose,
  onSelect,
  currentImageUrl,
}: ImageGalleryPickerProps) => {
  const [images, setImages] = useState<ProductImageInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingImage, setDeletingImage] = useState<string | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);
  const confirm = useConfirm();
  const { showToast } = useToast();

  const loadImages = async () => {
    try {
      setIsLoading(true);
      const fetchedImages = await getProductImages();
      setImages(fetchedImages);
    } catch (error) {
      console.error("Görseller yüklenemedi", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadImages();
      setSelectedUrl(currentImageUrl || null);
      setSelectedForDelete(new Set());
    }
  }, [isOpen, currentImageUrl]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && selectedUrl) {
        event.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedUrl]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const fileArray = Array.from(files);

      // Tüm dosyaları paralel yükle
      const uploadPromises = fileArray.map(file => uploadProductImage(file));
      const uploadedUrls = await Promise.all(uploadPromises);

      // Son yüklenen fotoğrafı seçili yap
      const lastUrl = uploadedUrls[uploadedUrls.length - 1];

      await loadImages();
      setSelectedUrl(lastUrl);

      showToast({
        type: "success",
        title: "Fotoğraflar yüklendi",
        description: `${fileArray.length} fotoğraf başarıyla yüklendi.`,
      });
    } catch (error) {
      console.error("Görsel yüklenemedi", error);
      showToast({
        type: "error",
        title: "Yükleme başarısız",
        description: error instanceof Error ? error.message : "Fotoğraflar yüklenemedi",
      });
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleConfirm = () => {
    if (selectedUrl) {
      onSelect(selectedUrl);
      onClose();
    }
  };

  const handleDoubleClick = (imageUrl: string) => {
    setSelectedUrl(imageUrl);
    onSelect(imageUrl);
    onClose();
  };

  const toggleSelectForDelete = (imageUrl: string) => {
    setSelectedForDelete(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageUrl)) {
        newSet.delete(imageUrl);
      } else {
        newSet.add(imageUrl);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedForDelete.size === images.length) {
      // Tümünü kaldır
      setSelectedForDelete(new Set());
    } else {
      // Tümünü seç
      setSelectedForDelete(new Set(images.map(img => img.url)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedForDelete.size === 0) return;

    const confirmed = await confirm({
      title: "Fotoğrafları Sil",
      description: `${selectedForDelete.size} fotoğrafı kalıcı olarak silmek istediğinize emin misiniz? Bu fotoğrafları kullanan tüm ürünlerden kaldırılacaktır.`,
      confirmLabel: "Sil",
      cancelLabel: "Vazgeç",
      tone: "danger",
    });

    if (!confirmed) return;

    try {
      setIsDeletingMultiple(true);

      // Tüm seçili fotoğrafları paralel sil
      const deletePromises = Array.from(selectedForDelete).map(url => deleteProductImage(url));
      await Promise.all(deletePromises);

      // State'ten silinen görselleri kaldır
      setImages(prev => prev.filter(img => !selectedForDelete.has(img.url)));

      // Eğer silinen fotoğraflar arasında seçili olan varsa seçimi kaldır
      if (selectedUrl && selectedForDelete.has(selectedUrl)) {
        setSelectedUrl(null);
      }

      showToast({
        type: "success",
        title: "Fotoğraflar silindi",
        description: `${selectedForDelete.size} fotoğraf başarıyla silindi.`,
      });

      setSelectedForDelete(new Set());
    } catch (error) {
      console.error("Fotoğraflar silinirken hata:", error);
      showToast({
        type: "error",
        title: "Silme başarısız",
        description: error instanceof Error ? error.message : "Fotoğraflar silinemedi",
      });
    } finally {
      setIsDeletingMultiple(false);
    }
  };

  const handleDeleteImage = async (imageUrl: string, filename: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Fotoğraf seçimini engelle

    const confirmed = await confirm({
      title: "Fotoğrafı Sil",
      description: `${filename} dosyasını kalıcı olarak silmek istediğinize emin misiniz? Bu fotoğrafı kullanan tüm ürünlerden kaldırılacaktır.`,
      confirmLabel: "Sil",
      cancelLabel: "Vazgeç",
      tone: "danger",
    });

    if (!confirmed) return;

    try {
      setDeletingImage(imageUrl);
      await deleteProductImage(imageUrl);

      // State'ten silinen görseli kaldır (API'ye yeniden istek atmadan)
      setImages(prev => prev.filter(img => img.url !== imageUrl));

      // Eğer silinen fotoğraf seçili ise seçimi kaldır
      if (selectedUrl === imageUrl) {
        setSelectedUrl(null);
      }

      showToast({
        type: "success",
        title: "Fotoğraf silindi",
        description: `${filename} başarıyla silindi.`,
      });
    } catch (error) {
      console.error("Fotoğraf silinirken hata:", error);
      showToast({
        type: "error",
        title: "Silme başarısız",
        description: error instanceof Error ? error.message : "Fotoğraf silinemedi",
      });
    } finally {
      setDeletingImage(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Fotoğraf Galerisi
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            {/* Upload Section */}
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-[#2a2a2a] dark:bg-[#1a1a1a]">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="gallery-upload"
                disabled={isUploading}
              />
              <label htmlFor="gallery-upload">
                <Button
                  as="span"
                  color="primary"
                  variant="flat"
                  startContent={isUploading ? <Spinner size="sm" /> : <Upload className="h-4 w-4" />}
                  isDisabled={isUploading}
                  className="cursor-pointer"
                >
                  {isUploading ? "Yükleniyor..." : "Yeni Fotoğraf Yükle"}
                </Button>
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Çoklu seçim yapabilirsiniz • Aşağıdan mevcut fotoğraf seçebilirsiniz
              </span>
            </div>

            {/* Bulk Actions */}
            {images.length > 0 && (
              <div className="flex justify-end items-center gap-2">
                <Button
                  variant="flat"
                  onPress={toggleSelectAll}
                  size="sm"
                >
                  {selectedForDelete.size === images.length ? "Seçimi Kaldır" : "Tümünü Seç"}
                </Button>
                {selectedForDelete.size > 0 && (
                  <Button
                    color="danger"
                    variant="flat"
                    onPress={handleDeleteSelected}
                    isLoading={isDeletingMultiple}
                    startContent={!isDeletingMultiple && <Trash2 className="h-4 w-4" />}
                    size="sm"
                  >
                    Seçilenleri Sil ({selectedForDelete.size})
                  </Button>
                )}
              </div>
            )}

            {/* Gallery Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : images.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Henüz fotoğraf yüklenmemiş
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                {images.map((image) => {
                  const isSelected = selectedUrl === image.url;
                  const isDeleting = deletingImage === image.url || isDeletingMultiple;
                  const isChecked = selectedForDelete.has(image.url);
                  return (
                    <button
                      key={image.filename}
                      type="button"
                      onClick={() => setSelectedUrl(image.url)}
                      onDoubleClick={() => handleDoubleClick(image.url)}
                      disabled={isDeleting}
                      className={`group relative overflow-hidden rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-primary shadow-md"
                          : "border-slate-200 hover:border-slate-300 dark:border-[#2a2a2a] dark:hover:border-[#3a3a3a]"
                      } ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="aspect-square">
                        <Image
                          src={`${API_BASE_URL}${image.url}`}
                          alt={image.filename}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                          <div className="rounded-full bg-primary p-2">
                            <Check className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      )}
                      {isDeleting && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Spinner size="lg" color="danger" />
                        </div>
                      )}
                      {/* Checkbox - sol üst köşe */}
                      <div
                        className={`absolute left-2 top-2 z-10 transition-opacity ${isChecked ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          isSelected={isChecked}
                          onValueChange={() => toggleSelectForDelete(image.url)}
                          size="md"
                          color="danger"
                          isDisabled={isDeleting}
                        />
                      </div>
                      {/* Silme butonu - sağ üst köşe */}
                      <button
                        type="button"
                        onClick={(e) => void handleDeleteImage(image.url, image.filename, e)}
                        disabled={isDeleting}
                        className="absolute right-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-red-500/90 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100 disabled:cursor-not-allowed"
                        title="Fotoğrafı kalıcı olarak sil"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <p className="truncate text-xs text-white">
                          {image.filename}
                        </p>
                        <p className="text-[10px] text-slate-300">
                          {formatFileSize(image.size)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} startContent={<X className="h-4 w-4" />}>
            İptal
          </Button>
          <Button
            color="primary"
            onPress={handleConfirm}
            isDisabled={!selectedUrl}
            startContent={<Check className="h-4 w-4" />}
          >
            Seç
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
