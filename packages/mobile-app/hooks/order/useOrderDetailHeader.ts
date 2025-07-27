//  "useOrderDetailHeader.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { useLayoutEffect } from "react";
import { useNavigation } from "expo-router";
import { useTranslation } from "react-i18next";

export function useOrderDetailHeader() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("order_detail.header.title"),
    });
  }, [navigation, t]);
}
