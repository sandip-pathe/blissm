import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { SplashScreen, Stack, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme } from "@/hooks/useColorScheme";
import { getAuth, onAuthStateChanged } from "firebase/auth"; // Import Firebase auth
import Colors from "@/constants/Colors";
import * as Font from "expo-font";
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
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        "Poppins-Regular": require("@/assets/fonts/Poppins-Regular.ttf"),
        "Poppins-Bold": require("@/assets/fonts/Poppins-Bold.ttf"),
      });
      setFontsLoaded(true);
      SplashScreen.hideAsync(); // Hide splash screen after fonts load
    }

    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return null; // Don't render UI until fonts are loaded
  }

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
          <Stack
            screenOptions={{
              headerShown: false,
              statusBarBackgroundColor: Colors.primary,
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(modals)" />
            <Stack.Screen name="(screens)" />
            <Stack.Screen name="(chat)" />
          </Stack>
        </AuthProvider>
      </ThemeProvider>
    </SQLiteProvider>
  );
};

export default RootLayout;
