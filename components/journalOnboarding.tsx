import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import Colors from "@/constants/Colors";
import { useRouter } from "expo-router";

const JournalOnboarding = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome, Sandy!</Text>
      <Image
        source={require("../assets/images/Illustration.png")}
        resizeMode="contain"
        style={styles.image}
      />
      <Text style={styles.noJournal}>No journal entries found</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.navigate("../(screens)/new")}
      >
        <Text style={styles.buttonText}>Start New Journal</Text>
      </TouchableOpacity>
      <View style={styles.howItWorksContainer}>
        <Text style={styles.howItWorksTitle}>🛠 How It Works</Text>
        <Text style={styles.howItWorksText}>
          1️⃣ <Text style={styles.howItWorksText2}>Start a new journal</Text>
        </Text>
        <Text style={styles.howItWorksText}>
          2️⃣ Pick a{" "}
          <Text style={styles.howItWorksText2}>Getting Started Prompt</Text>{" "}
          from the list.
        </Text>
        <Text style={styles.howItWorksText}>
          3️⃣<Text style={styles.howItWorksText2}> Respond freely</Text> in your
          journal.
        </Text>
        <Text style={styles.howItWorksText}>
          4️⃣<Text style={styles.howItWorksText2}> Tap 'Inspire Me'</Text> – AI
          analyzes your entry & suggests a follow-up prompt.
        </Text>
        <Text style={styles.howItWorksText}>
          5️⃣{" "}
          <Text style={styles.howItWorksText2}>
            Answer AI-generated prompts
          </Text>{" "}
          to deepen self-reflection & unlock insights.
        </Text>
      </View>
    </View>
  );
};

export default JournalOnboarding;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    gap: 10,
  },
  welcome: {
    fontSize: 24,
    color: Colors.accent2,
    fontFamily: "Poppins-Bold",
  },
  image: {
    width: 200,
    height: 200,
  },
  noJournal: {
    fontSize: 16,
    color: Colors.greyLight,
    fontFamily: "Poppins-Regular",
  },
  button: {
    backgroundColor: Colors.accent,
    padding: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: Colors.light,
    fontFamily: "Poppins-Bold",
    fontSize: 16,
  },
  howItWorksContainer: {
    padding: 16,
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    width: "100%",
  },
  howItWorksTitle: {
    fontSize: 20,
    color: Colors.light,
    textAlign: "center",
    marginBottom: 10,
    fontFamily: "Poppins-Bold",
  },
  howItWorksText: {
    color: Colors.light,
    fontFamily: "Poppins-Regular",
  },
  howItWorksText2: {
    color: Colors.accent,
    fontFamily: "Poppins-Bold",
  },
});
