//  "SendCodeButton.tsx"
//  metropolitan app
//  Created by Ahmet on 29.06.2025.

import { BaseButton } from "@/components/base/BaseButton";
import React from "react";

interface SendCodeButtonProps {
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
  title: string;
}

export const SendCodeButton: React.FC<SendCodeButtonProps> = ({
  loading,
  disabled,
  onPress,
  title,
}) => {
  return (
    <BaseButton
      variant="primary"
      size="small"
      title={title}
      loading={loading}
      disabled={disabled}
      onPress={onPress}
      fullWidth
    />
  );
};
