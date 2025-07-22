//  "PhotoPreviewModal.tsx"
//  metropolitan app
//  Created by Ahmet on 15.07.2025.
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Modal, Pressable, View } from "react-native";

import { HapticIconButton } from "@/components/HapticButton";
import { useAuth } from "@/context/AuthContext";

interface PhotoPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export function PhotoPreviewModal({
  visible,
  onClose,
  onEdit,
}: PhotoPreviewModalProps) {
  const { user } = useAuth();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.92)",
          justifyContent: "center",
          alignItems: "center",
        }}
        onPress={onClose}
      >
        <Image
          source={
            user?.profilePicture ||
            require("@/assets/images/default-avatar.png")
          }
          style={{
            width: 320,
            height: 320,
            borderRadius: 160,
            borderWidth: 2,
            borderColor: "#fff",
          }}
          contentFit="cover"
          accessibilityLabel="Profil fotoğrafı büyük önizleme"
        />
        <View
          style={{
            position: "absolute",
            top: 48,
            right: 32,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <HapticIconButton
            hapticType="medium"
            onPress={onEdit}
            style={{
              backgroundColor: "rgba(255,255,255,0.12)",
              borderRadius: 18,
              width: 44,
              height: 44,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 8,
            }}
            accessibilityRole="button"
            accessibilityLabel="Düzenle"
            size={44}
          >
            <Ionicons name="pencil" size={24} color="#fff" />
          </HapticIconButton>
          <HapticIconButton
            hapticType="light"
            onPress={onClose}
            style={{
              backgroundColor: "rgba(255,255,255,0.12)",
              borderRadius: 18,
              width: 44,
              height: 44,
              justifyContent: "center",
              alignItems: "center",
            }}
            accessibilityRole="button"
            accessibilityLabel="Kapat"
            size={44}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </HapticIconButton>
        </View>
      </Pressable>
    </Modal>
  );
}
