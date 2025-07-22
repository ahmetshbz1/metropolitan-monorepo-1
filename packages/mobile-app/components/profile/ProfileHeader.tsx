import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useHaptics } from "@/hooks/useHaptics";
import { ProfileBadge } from "./ProfileBadge";

export function ProfileHeader() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const colors = Colors[colorScheme ?? "light"];
  const { withHapticFeedback } = useHaptics();

  const handlePress = withHapticFeedback(() => {
    router.push("/edit-profile");
  }, "light");

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={{
        marginHorizontal: 16,
        marginTop: 10,
        alignSelf: "stretch",
        width: "auto",
      }}
    >
      <View
        style={{
          width: "100%",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
          borderRadius: 16,
          backgroundColor: colors.card,
        }}
      >
        <ThemedView
          className="flex-row items-center p-4 overflow-hidden rounded-2xl"
          lightColor={Colors.light.card}
          darkColor={Colors.dark.card}
        >
          <Image
            source={
              user?.profilePicture
                ? { uri: user.profilePicture }
                : require("@/assets/images/default-avatar.png")
            }
            style={{ width: 60, height: 60, borderRadius: 30, marginRight: 15 }}
            contentFit="cover"
          />
          <View style={{ flex: 1, backgroundColor: "transparent" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <ThemedText className="text-xl font-bold">
                {user?.firstName} {user?.lastName}
              </ThemedText>
              {user && (
                <ProfileBadge
                  type={user?.userType === "corporate" ? "b2b" : "b2c"}
                />
              )}
            </View>
            <ThemedText
              className="text-sm mt-1"
              style={{ color: colors.mediumGray }}
            >
              {user?.email}
            </ThemedText>
          </View>
        </ThemedView>
      </View>
    </TouchableOpacity>
  );
}
