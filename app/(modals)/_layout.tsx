import { useTheme } from "@react-navigation/native";
import { Stack } from "expo-router";
import React from "react";

const ModalLayout = () => {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        statusBarBackgroundColor: colors.background,
      }}
    >
      <Stack.Screen
        name="forgotPasswordModal"
        options={{ title: "Forgot Password" }}
      />
      <Stack.Screen name="promptsModal" />
      <Stack.Screen name="Desclaimer" />
    </Stack>
  );
};

export default ModalLayout;
