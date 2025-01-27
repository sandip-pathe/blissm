import { Stack, Tabs } from "expo-router";

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="ChatScreen"
        options={{
          statusBarBackgroundColor: "rgb(1, 1, 1)",
        }}
      />
    </Stack>
  );
}
