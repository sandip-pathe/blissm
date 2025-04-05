import { ThemeProvider, useTheme } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { SplashScreen, Stack, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme } from "@/hooks/useColorScheme";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import * as Font from "expo-font";
import { SQLiteProvider } from "expo-sqlite";
import { migrateDbIfNeeded } from "@/database/sqlite";
import { AuthProvider } from "@/components/authContext";
import { PostHogProvider } from "posthog-react-native";
import { View, Image } from "react-native";
import useSessionTracking from "@/components/SessionTracking";
import { NetworkProvider } from "@/components/NetworkContext";
import { DefaultTheme, DarkTheme } from "@/theme/themes";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "/",
};

SplashScreen.preventAutoHideAsync();

const RootLayout: React.FC = () => {
  const router = useRouter();
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useSessionTracking();
  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        "Poppins-Regular": require("@/assets/fonts/Poppins-Regular.ttf"),
        "Poppins-Bold": require("@/assets/fonts/Poppins-Bold.ttf"),
      });
      setFontsLoaded(true);
      SplashScreen.hideAsync();
    }
    loadFonts();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {!fontsLoaded ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "red",
          }}
        >
          <Image
            source={require("../assets/images/adaptive-icon.png")}
            style={{ width: 350, height: 350 }}
          />
        </View>
      ) : (
        <PostHogProvider
          apiKey="phc_6HZZECRL18wphTUSTyJ7mkFhxwFc7vUVd0ocrmlJKTX"
          autocapture
          options={{
            host: "https://us.i.posthog.com",
            enableSessionReplay: true,
            sessionReplayConfig: {
              androidDebouncerDelayMs: 1000,
              captureLog: true,
              captureNetworkTelemetry: true,
            },
          }}
        >
          <RootLayoutNav router={router} />
        </PostHogProvider>
      )}
    </GestureHandlerRootView>
  );
};

const RootLayoutNav: React.FC<{ router: any }> = ({ router }) => {
  const colorScheme = useColorScheme();
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await router.replace("/(tabs)");
      } else {
        console.log("No authenticated user, navigating to (auth)");
        await router.replace("/(auth)");
      }
      SplashScreen.hideAsync();
    });

    return () => unsubscribe();
  }, []);

  return (
    <SQLiteProvider databaseName="chatd.db" onInit={migrateDbIfNeeded}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <NetworkProvider>
          <AuthProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                statusBarBackgroundColor:
                  colorScheme === "dark" ? "#10151A" : "#E8F1EC",
                statusBarStyle: colorScheme === "dark" ? "light" : "dark",
              }}
            >
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(modals)" />
              <Stack.Screen name="(screens)" />
              <Stack.Screen name="(chat)" />
            </Stack>
          </AuthProvider>
        </NetworkProvider>
      </ThemeProvider>
    </SQLiteProvider>
  );
};

export default RootLayout;
