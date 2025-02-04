import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import React, { useEffect } from "react";
import { SplashScreen, Stack, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme } from "@/hooks/useColorScheme";
import { getAuth, onAuthStateChanged } from "firebase/auth"; // Import Firebase auth
import Colors from "@/constants/Colors";
import {
  SQLiteProvider,
  useSQLiteContext,
  type SQLiteDatabase,
} from "expo-sqlite";
import { migrateDbIfNeeded } from "@/database/sqlite";
import { AuthProvider } from "@/components/authContext";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(modals)/login",
};

SplashScreen.preventAutoHideAsync();

const RootLayout: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootLayoutNav router={router} />
    </GestureHandlerRootView>
  );
};

const RootLayoutNav: React.FC<{ router: any }> = ({ router }) => {
  const colorScheme = useColorScheme();

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/(tabs)");
      } else {
        // User is not authenticated, navigate to the login screen
        router.replace("(modals)/login");
      }
    });

    // Clean up the subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <SQLiteProvider databaseName="chats.db" onInit={migrateDbIfNeeded}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <Stack>
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
                statusBarBackgroundColor: "rgb(1, 1, 1)",
              }}
            />
            <Stack.Screen
              name="(modals)"
              options={{
                headerShown: false,
                statusBarBackgroundColor: "rgb(1, 1, 1)",
              }}
            />
            <Stack.Screen
              name="(screens)"
              options={{
                headerShown: false,
                statusBarBackgroundColor: "rgb(1, 1, 1)",
              }}
            />
            <Stack.Screen
              name="(chat)"
              options={{
                headerShown: false,
                statusBarBackgroundColor: "rgb(1, 1, 1)",
              }}
            />
          </Stack>
        </AuthProvider>
      </ThemeProvider>
    </SQLiteProvider>
  );
};

export default RootLayout;
