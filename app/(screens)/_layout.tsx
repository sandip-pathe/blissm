import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="JournalScreen"
        options={{
          statusBarBackgroundColor: "rgb(1, 1, 1)",
        }}
      />
    </Stack>
  );
}
