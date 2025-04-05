import { useTheme } from "@react-navigation/native";
import React from "react";
import { Text, Image, StyleSheet, ScrollView, View } from "react-native";

const ChatOnboarding: React.FC = () => {
  const { colors } = useTheme();
  const styles = themedStyles(colors);
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={require("../assets/images/no-chat.png")}
        style={styles.illustration}
        resizeMode="contain"
      />
      <Text style={styles.noChatText}>No Conversations Yet</Text>
      <View>
        <Text style={styles.heroTitle}>
          Ever wished for a judgment-free, expert listener?
        </Text>
        <Text style={styles.heroTitle}>Meet your BlissMate.</Text>
        <Text style={styles.howItWorksPoints}>🧠 Talk it out</Text>
        <Text style={styles.howItWorksText}>
          Chat with AI-powered guides trained in mental wellness.
        </Text>
        <Text style={styles.howItWorksPoints}>🔍 Find clarity</Text>
        <Text style={styles.howItWorksText}>
          Get real-time insights on stress, procrastination, and more.
        </Text>
        <Text style={styles.howItWorksPoints}>🌱 Feel supported</Text>
        <Text style={styles.howItWorksText}>
          Your BlissMate is here 24/7—whenever you need to talk.
        </Text>
      </View>
    </ScrollView>
  );
};

const themedStyles = (colors) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
      backgroundColor: colors.background,
    },
    illustration: {
      width: 200,
      height: 80,
      marginBottom: 20,
    },
    noChatText: {
      color: colors.border,
      fontFamily: "Poppins-Regular",
      marginBottom: 10,
      textAlign: "center",
    },
    heroTitle: {
      fontSize: 16,
      color: colors.primary,
      textAlign: "center",
      fontFamily: "Poppins-Bold",
      paddingHorizontal: 10,
    },
    howItWorksText: {
      fontSize: 14,
      color: colors.border,
      fontFamily: "Poppins-Regular",
      textAlign: "center",
      paddingHorizontal: 10,
    },
    howItWorksPoints: {
      fontSize: 14,
      color: colors.text,
      fontFamily: "Poppins-Bold",
      textAlign: "center",
      paddingHorizontal: 10,
    },
  });

export default ChatOnboarding;
