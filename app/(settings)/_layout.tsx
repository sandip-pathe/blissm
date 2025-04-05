import { useTheme } from "@react-navigation/native";
import { Stack } from "expo-router";
import React from "react";

const SettingsLayout = () => {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        statusBarBackgroundColor: colors.background,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="premium" />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="chatSettings" options={{ title: "Chats" }} />
      <Stack.Screen name="JournalSettings" options={{ title: "Journals" }} />
    </Stack>
  );
};

export default SettingsLayout;
