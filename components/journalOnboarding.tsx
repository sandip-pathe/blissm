import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";

const JournalOnboarding = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = themedStyles(colors);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/Illustration.png")}
        resizeMode="contain"
        style={styles.image}
      />
      <Text style={styles.noJournal}>
        Your thoughts shape your life. Let’s uncover them together.
      </Text>
      <View style={styles.howItWorksContainer}>
        <Text style={styles.howItWorksTitle}>How It Works</Text>
        <Text style={styles.howItWorksText2}>✍️ Start writing</Text>
        <Text style={styles.howItWorksText}>Pick a simple prompt.</Text>
        <Text style={styles.howItWorksText2}>🔍 AI Insight</Text>
        <Text style={styles.howItWorksText}>
          Get real-time feedback & deeper questions.
        </Text>
        <Text style={styles.howItWorksText2}>🌱 Track Growth</Text>
        <Text style={styles.howItWorksText}>
          Notice patterns in your thoughts over time.
        </Text>
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.navigate("../(screens)/new")}
      >
        <Text style={styles.buttonText}>Start Your First Journal</Text>
      </TouchableOpacity>
    </View>
  );
};

export default JournalOnboarding;

const themedStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 16,
      gap: 10,
    },
    image: {
      width: 200,
      height: 200,
    },
    noJournal: {
      fontSize: 16,
      color: colors.border,
      fontFamily: "Poppins-Regular",
      textAlign: "center",
    },
    button: {
      backgroundColor: colors.notification,
      padding: 8,
      borderRadius: 8,
    },
    buttonText: {
      color: colors.text,
      fontFamily: "Poppins-Bold",
      fontSize: 16,
    },
    howItWorksContainer: {
      padding: 10,
      backgroundColor: colors.card,
      borderRadius: 10,
      width: "100%",
    },
    howItWorksTitle: {
      fontSize: 20,
      color: colors.text,
      textAlign: "center",
      marginBottom: 10,
      fontFamily: "Poppins-Bold",
    },
    howItWorksText: {
      color: colors.text,
      fontFamily: "Poppins-Regular",
      textAlign: "center",
    },
    howItWorksText2: {
      color: colors.notification,
      fontFamily: "Poppins-Bold",
      textAlign: "center",
    },
  });
