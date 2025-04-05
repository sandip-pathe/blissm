import { useTheme } from "@react-navigation/native";
import { Stack, Tabs } from "expo-router";

const ChatLayout = () => {
  const { colors } = useTheme();
  return (
    <Stack>
      <Stack.Screen name="ChatScreen" />
    </Stack>
  );
};

export default ChatLayout;
