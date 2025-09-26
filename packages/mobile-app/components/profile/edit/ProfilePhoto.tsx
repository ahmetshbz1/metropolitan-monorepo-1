//  "ProfilePhoto.tsx"
//  metropolitan app
//  Created by Ahmet on 15.07.2025.
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";

interface ProfilePhotoProps {
  photoLoading: boolean;
  onChoosePhoto: () => void;
  onPreview: () => void;
}

export function ProfilePhoto({
  photoLoading,
  onChoosePhoto,
  onPreview,
}: ProfilePhotoProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <View className="items-center mb-8">
      <TouchableOpacity
        onPress={user?.profilePicture ? onPreview : undefined}
        activeOpacity={user?.profilePicture ? 0.85 : 1}
      >
        {user?.profilePicture ? (
          <Image
            source={user.profilePicture}
            style={{ width: 120, height: 120, borderRadius: 60 }}
            contentFit="cover"
            accessibilityLabel="Profil fotoğrafı"
          />
        ) : (
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: colors.primary + "20",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="person" size={56} color={colors.primary} />
          </View>
        )}
      </TouchableOpacity>
      {photoLoading ? (
        <ActivityIndicator style={{ marginTop: 10 }} />
      ) : (
        <TouchableOpacity className="mt-2.5" onPress={onChoosePhoto}>
          <ThemedText style={{ color: colors.tint }}>
            {t("edit_profile.change_photo")}
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
}
