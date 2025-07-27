//  "Colors.ts"
//  metropolitan app
//  Created by Ahmet on 09.07.2025.

/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { lightTheme, darkTheme } from "./colors/theme";
import { lightStatusBadge, darkStatusBadge } from "./colors/statusBadge";
import { lightGrayScale, darkGrayScale } from "./colors/grayScale";
import { gradients } from "./colors/gradients";
import { ColorUtils, StatusUtils } from "./colors/utils";

/**
 * Premium Avrupa/Polonya renk sistemi - Zalando kalitesinde
 * Modern e-ticaret uygulaması için tasarlanmış profesyonel renk paleti
 */

export default {
  light: {
    ...lightTheme,
    statusBadge: lightStatusBadge,
    ...lightGrayScale,
  },
  dark: {
    ...darkTheme,
    statusBadge: darkStatusBadge,
    ...darkGrayScale,
  },
};

// Re-export utilities and gradients
export { gradients, ColorUtils, StatusUtils };
