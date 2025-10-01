//  "AuthHeaderImage.tsx"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import React from "react";
import { useWindowDimensions, View } from "react-native";
import Svg, { ClipPath, Defs, Image, Path } from "react-native-svg";

type ClipPathProps = {
  width: number;
  imageHeight: number;
  curveHeight: number;
};

const CustomClipPath: React.FC<ClipPathProps> = ({
  width,
  imageHeight,
  curveHeight,
}) => (
  <Defs>
    <ClipPath id="clip">
      <Path
        d={`M0,0 H${width} V${imageHeight - curveHeight} C${width * 0.7},${imageHeight} ${
          width * 0.3
        },${imageHeight} 0,${imageHeight - curveHeight} Z`}
      />
    </ClipPath>
  </Defs>
);

export const AuthHeaderImage: React.FC = () => {
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;
  const imageHeight = isTablet ? Math.min(width * 0.9, 550) : width;
  const curveHeight = Math.min(32, imageHeight * 0.2);

  return (
    <View style={{ height: imageHeight }} className="w-full">
      <Svg width={width} height={imageHeight}>
        <CustomClipPath
          width={width}
          imageHeight={imageHeight}
          curveHeight={curveHeight}
        />
        <Image
          href={require("@/assets/images/yayla.webp")}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#clip)"
        />
      </Svg>
    </View>
  );
};
