'use client';

import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface QRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QRDialog({ open, onOpenChange }: QRDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden" showCloseButton={false}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-center flex-1">
              Uygulama
            </h2>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-full p-1 hover:bg-muted transition-colors"
            >
              <X size={24} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Description */}
          <p className="text-center text-muted-foreground mb-6 text-lg">
            Mağazaya gitmek için telefonunuzla tarayın.
          </p>

          {/* Large QR Code */}
          <div className="flex justify-center mb-6">
            <div className="w-80 h-80 bg-white border rounded-lg flex items-center justify-center p-4">
              <img 
                src="/qr.svg" 
                alt="QR Code" 
                className="w-full h-full" 
              />
            </div>
          </div>

          {/* App Store Buttons */}
          <div className="flex justify-center gap-4">
            <a
              href="#"
              className="hover:opacity-80 transition-opacity duration-200"
            >
              <img 
                src="/app-store-badge.svg" 
                alt="App Store'dan İndir" 
                className="h-14 w-auto" 
              />
            </a>
            <a
              href="#"
              className="hover:opacity-80 transition-opacity duration-200"
            >
              <img 
                src="/google-play-badge.svg" 
                alt="Google Play'den İndir" 
                className="h-14 w-auto" 
              />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}