//  "useImagePicker.ts"
//  metropolitan app
//  Created by Ahmet on 15.07.2025.
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActionSheetIOS, Alert, Platform } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";

export function useImagePicker() {
  const { t } = useTranslation();
  const { uploadProfilePhoto } = useAuth();
  const { showToast } = useToast();
  const [photoLoading, setPhotoLoading] = useState(false);

  const pickImage = async (source: "camera" | "gallery") => {
    let result;
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    };

    try {
      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          showToast(
            t("permissions.camera_required_message"),
            "warning"
          );
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          showToast(
            t("permissions.gallery_required_message"),
            "warning"
          );
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled) {
        setPhotoLoading(true);
        const { success, message } = await uploadProfilePhoto(
          result.assets[0].uri
        );
        setPhotoLoading(false);

        if (!success) {
          showToast(message, "error");
        }
      }
    } catch (error) {
      // Removed console statement
      showToast(t("edit_profile.photo_error_generic"), "error");
      setPhotoLoading(false);
    }
  };

  const handleChoosePhoto = () => {
    const options = [
      t("edit_profile.camera"),
      t("edit_profile.gallery"),
      t("common.cancel"),
    ];

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            pickImage("camera");
          } else if (buttonIndex === 1) {
            pickImage("gallery");
          }
        }
      );
    } else {
      Alert.alert(
        t("edit_profile.change_photo"),
        "",
        [
          {
            text: t("edit_profile.camera"),
            onPress: () => pickImage("camera"),
          },
          {
            text: t("edit_profile.gallery"),
            onPress: () => pickImage("gallery"),
          },
          { text: t("common.cancel"), style: "cancel" },
        ],
        { cancelable: true }
      );
    }
  };

  return {
    photoLoading,
    handleChoosePhoto,
  };
}
