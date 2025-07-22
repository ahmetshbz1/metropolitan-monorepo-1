//  "deliveryPaymentStyles.ts"
//  metropolitan app
//  Created by Ahmet on 22.06.2025.

import { StyleSheet } from "react-native";

export const createDeliveryPaymentStyles = (colors: any) => ({
  container: {
    backgroundColor: colors.cardBackground,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.lightGray,
  },
  infoRowIcon: {
    marginRight: 15,
  },
  expandedContent: {
    marginTop: 10,
    paddingLeft: 40,
  },
});

export const INFO_ROW_CONFIG = {
  iconSize: 22,
  chevronSize: 22,
} as const;
