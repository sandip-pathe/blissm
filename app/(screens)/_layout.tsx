import { useTheme } from "@react-navigation/native";
import { Stack } from "expo-router";

const JournalLayout = () => {
  const { colors } = useTheme();
  return (
    <Stack>
      <Stack.Screen
        name="JournalScreen"
        options={{
          statusBarBackgroundColor: colors.background,
        }}
      />
    </Stack>
  );
};

export default JournalLayout;
