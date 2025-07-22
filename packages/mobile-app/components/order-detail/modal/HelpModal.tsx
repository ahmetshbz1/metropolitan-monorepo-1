//  "HelpModal.tsx"
//  metropolitan app
//  Created by Ahmet on 19.06.2025.

import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";

import CustomBottomSheet from "@/components/CustomBottomSheet";
import { HelpContent } from "@/components/profile/HelpContent";

type Ref = BottomSheetModal;

// In a real app, you would pass the order's delivery address dynamically.
const deliveryAddress = "ul. Złota 44, 00-120 Warszawa, Poland";

export const HelpModal = forwardRef<Ref>((_, ref) => {
  const { t } = useTranslation();
  return (
    <CustomBottomSheet ref={ref} title={t("order_detail.help_modal.title")}>
      <HelpContent
        infoText={t("order_detail.help_modal.info_text")}
        address={{
          title: t("order_detail.help_modal.address_title"),
          value: deliveryAddress,
        }}
        showSocialMedia={true}
      />
    </CustomBottomSheet>
  );
});

HelpModal.displayName = "HelpModal";
