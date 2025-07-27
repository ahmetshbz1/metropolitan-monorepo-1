//  "AuthHeaderImage.tsx"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import React from "react";
import { Dimensions, View } from "react-native";
import Svg, { ClipPath, Defs, Image, Path } from "react-native-svg";

const { width } = Dimensions.get("window");
const imageHeight = width * 1;
const curveHeight = 20;

const CustomClipPath = () => (
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
  return (
    <View style={{ height: imageHeight }} className="w-full">
      <Svg width={width} height={imageHeight}>
        <CustomClipPath />
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