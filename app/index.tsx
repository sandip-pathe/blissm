import React, { useEffect } from "react";
import { View, StyleSheet, Image } from "react-native";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter, SplashScreen, Stack } from "expo-router";
import { useTheme } from "@react-navigation/native";

const Splash = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = themedStyles(colors);
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User ALready logged in, navigating to (tabs)");
        router.replace("./(tabs)");
      } else {
        console.log("No authenticated user, navigating to (auth)");
        router.replace("./(auth)");
      }
      SplashScreen.hideAsync();
    });
    return () => unsubscribe();
  }, [router]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          statusBarBackgroundColor: colors.primary,
        }}
      />
      <View style={styles.container}>
        <View>
          <Image
            source={require("../assets/images/adaptive-icon.png")}
            style={{ width: 200, height: 200 }}
          />
        </View>
      </View>
    </>
  );
};

export default Splash;

const themedStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.primary,
    },
    text: {
      fontSize: 100,
      color: colors.text,
      marginRight: 5,
    },
  });
