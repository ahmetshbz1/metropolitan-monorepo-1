import { useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Image,
  Input,
  Spinner,
} from "@heroui/react";
import { Check, Search, Trash2, Upload, X } from "lucide-react";

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
  const [filteredImages, setFilteredImages] = useState<ProductImageInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingImage, setDeletingImage] = useState<string | null>(null);
  const confirm = useConfirm();
  const { showToast } = useToast();

  const loadImages = async () => {
    try {
      setIsLoading(true);
      const fetchedImages = await getProductImages();
      setImages(fetchedImages);
      setFilteredImages(fetchedImages);
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
      setSearchQuery("");
    }
  }, [isOpen, currentImageUrl]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredImages(images);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = images.filter((img) =>
      img.filename.toLowerCase().includes(query)
    );
    setFilteredImages(filtered);
  }, [searchQuery, images]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const imageUrl = await uploadProductImage(file);
      await loadImages();
      setSelectedUrl(imageUrl);
    } catch (error) {
      console.error("Görsel yüklenemedi", error);
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
      await loadImages();

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
                veya aşağıdan mevcut bir fotoğraf seçin
              </span>
            </div>

            {/* Search */}
            <Input
              placeholder="Fotoğraf ara..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<Search className="h-4 w-4 text-slate-400" />}
              variant="bordered"
              size="sm"
            />

            {/* Gallery Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {searchQuery ? "Arama sonucu bulunamadı" : "Henüz fotoğraf yüklenmemiş"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                {filteredImages.map((image) => {
                  const isSelected = selectedUrl === image.url;
                  const isDeleting = deletingImage === image.url;
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
