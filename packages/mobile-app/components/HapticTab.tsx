//  "HapticTab.tsx"
//  metropolitan app
//  Created by Ahmet on 08.06.2025.

import { useHaptics } from "@/hooks/useHaptics";
import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";

export function HapticTab(props: BottomTabBarButtonProps) {
  const { triggerHaptic } = useHaptics();

  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        triggerHaptic("light");
        props.onPressIn?.(ev);
      }}
    />
  );
}
