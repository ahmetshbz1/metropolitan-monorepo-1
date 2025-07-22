//  "Divider.tsx"
//  metropolitan app
//  Created by Ahmet on 21.06.2025.

import { createDeliveryPaymentStyles } from "@/utils/deliveryPaymentStyles";
import React from "react";
import { View } from "react-native";

interface DividerProps {
  colors: any;
}

export const Divider: React.FC<DividerProps> = ({ colors }) => {
  const styles = createDeliveryPaymentStyles(colors);

  return <View className="my-1" style={styles.divider} />;
};
