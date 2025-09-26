import React, { useEffect, useState } from "react";
import { Modal, View, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NotificationPermissionScreen } from "./NotificationPermissionScreen";

const { width, height } = Dimensions.get("window");

export function OnboardingModal() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      // Check if onboarding has been shown before
      const hasSeenOnboarding = await AsyncStorage.getItem("has_seen_onboarding");
      const notificationAsked = await AsyncStorage.getItem("onboarding_notification_asked");

      // Show onboarding if user hasn't seen it
      if (!hasSeenOnboarding || !notificationAsked) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem("has_seen_onboarding", "true");
      setShowOnboarding(false);
    } catch (error) {
      console.error("Error saving onboarding status:", error);
    }
  };

  if (loading || !showOnboarding) {
    return null;
  }

  return (
    <Modal
      visible={showOnboarding}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <View style={{ width, height }}>
        <NotificationPermissionScreen onContinue={handleOnboardingComplete} />
      </View>
    </Modal>
  );
}