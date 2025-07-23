//  "AnimatedCheckmark.tsx"
//  metropolitan app
//  Created by Ahmet on 23.07.2025.

import React, { useEffect } from "react";
import Svg, { Path } from "react-native-svg";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface AnimatedCheckmarkProps {
  size?: number;
  color?: string;
  visible: boolean;
}

export const AnimatedCheckmark: React.FC<AnimatedCheckmarkProps> = ({
  size = 18,
  color = "#10b981",
  visible,
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, {
      duration: 400,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
    });
  }, [visible, progress]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = 24 * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <AnimatedPath
        d="M9 12l2 2 4-4"
        stroke={color}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={24}
        animatedProps={animatedProps}
      />
    </Svg>
  );
};