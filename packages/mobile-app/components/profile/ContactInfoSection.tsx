//  "ContactInfoSection.tsx"
//  metropolitan app
//  Created by Ahmet on 27.06.2025.

import React from "react";
import { useTranslation } from "react-i18next";

import { HelpContent } from "./HelpContent";

export function ContactInfoSection() {
  const { t } = useTranslation();
  return (
    <HelpContent
      infoText={t("profile.contact.info_text")}
      address={{
        title: t("profile.contact.address_title"),
        value: "ul. Marszałkowska 1/2, 00-624 Warszawa, Poland",
      }}
      showSocialMedia={true}
    />
  );
}
