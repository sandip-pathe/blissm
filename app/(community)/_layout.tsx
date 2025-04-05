import { useTheme } from "@react-navigation/native";
import { Stack, Tabs } from "expo-router";

const ChatLayout = () => {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="new" options={{ title: "Feed" }} />
    </Stack>
  );
};

export default ChatLayout;
