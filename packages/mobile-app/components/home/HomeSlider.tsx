//  "HomeSlider.tsx"
//  metropolitan app
//  Created by Ahmet on 27.06.2025.

import { Image } from "expo-image";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

const sliderImages = [
  require("@/assets/images/yayla.webp"),
  require("@/assets/images/yayla.webp"),
];

const { width } = Dimensions.get("window");
const H_MARGIN = 4; // minimal margin for maximum width
const SLIDER_WIDTH = width - H_MARGIN * 2;
const SLIDER_HEIGHT = width * 0.6; // height ratio
const BORDER_RADIUS = 20;

export function HomeSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Auto-scroll logic
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % sliderImages.length;
      scrollViewRef.current?.scrollTo({ x: nextIndex * SLIDER_WIDTH, animated: true });
    }, 3000); // 3 seconds

    return () => clearInterval(interval);
  }, [activeIndex]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slide = Math.round(
      event.nativeEvent.contentOffset.x /
        event.nativeEvent.layoutMeasurement.width
    );
    if (slide !== activeIndex) {
      setActiveIndex(slide);
    }
  };

return (
    <View
      className="mb-4"
      style={{
        height: SLIDER_HEIGHT,
        marginHorizontal: H_MARGIN,
        borderRadius: BORDER_RADIUS,
        overflow: "hidden", // ensure images are clipped to rounded corners
        backgroundColor: "transparent",
      }}
    >
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ width: SLIDER_WIDTH, height: SLIDER_HEIGHT, alignSelf: "center" }}
      >
        {sliderImages.map((image, index) => (
          <View
            key={index}
            className="justify-center items-center"
            style={{ width: SLIDER_WIDTH, height: SLIDER_HEIGHT }}
          >
<Image
              source={image}
              style={{ width: "100%", height: "100%", borderRadius: BORDER_RADIUS }}
              contentFit="cover"
            />
          </View>
        ))}
      </ScrollView>
      <View className="absolute bottom-2.5 left-0 right-0 flex-row justify-center items-center">
        {sliderImages.map((_, index) => (
          <View
            key={index}
            className="w-2 h-2 rounded mx-1"
            style={[
              { backgroundColor: colors.mediumGray },
              activeIndex === index && {
                backgroundColor: colors.tint,
                width: 20,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}
