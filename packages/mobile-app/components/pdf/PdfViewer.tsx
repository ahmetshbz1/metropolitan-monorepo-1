//  "PdfViewer.tsx"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import React from "react";
import { View, ActivityIndicator } from "react-native";
import Pdf from "react-native-pdf";
import { ThemedText } from "../ThemedText";
import { useTranslation } from "react-i18next";

interface PdfViewerProps {
  source: any;
  onLoadComplete: (numberOfPages: number) => void;
  onPageChanged: (page: number) => void;
  onError: (error: any) => void;
  colors: any;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  source,
  onLoadComplete,
  onPageChanged,
  onError,
  colors,
}) => {
  const { t } = useTranslation();

  return (
    <Pdf
      source={source}
      onLoadComplete={onLoadComplete}
      onPageChanged={onPageChanged}
      onError={onError}
      onPressLink={(uri) => {
        console.log(`Link tıklandı: ${uri}`);
      }}
      style={{
        flex: 1,
        backgroundColor: "transparent",
      }}
      trustAllCerts={false}
      enablePaging={true}
      enableAnnotationRendering={true}
      spacing={10}
      minScale={1}
      maxScale={3.0}
      scale={1.0}
      horizontal={false}
      enableDoubleTapZoom={true}
      fitPolicy={0} // 0: FitWidth, 1: FitHeight, 2: FitBoth
      renderActivityIndicator={() => (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText className="text-base opacity-70 mt-2">
            {t("invoice_preview.loading")}
          </ThemedText>
        </View>
      )}
    />
  );
};