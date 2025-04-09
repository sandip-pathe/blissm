import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Image,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { FIREBASE_AUTH, FIRESTORE_DB } from "../../constants/firebaseConf";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useCustomAuth } from "@/components/authContext";
import { posthog } from "@/constants/posthogConfig";
import { useTheme } from "@react-navigation/native";
import Checkbox from "expo-checkbox";

// Adjective and noun lists for username generation
const adjectives = [
  "Happy",
  "Brave",
  "Calm",
  "Eager",
  "Gentle",
  "Jolly",
  "Kind",
  "Lively",
  "Proud",
  "Silly",
  "Witty",
  "Zany",
  "Clever",
  "Daring",
  "Fierce",
  "Gleeful",
];
const nouns = [
  "Panda",
  "Fox",
  "Raccoon",
  "Koala",
  "Dragon",
  "Phoenix",
  "Wolf",
  "Owl",
  "Rabbit",
  "Tiger",
  "Bear",
  "Eagle",
  "Hawk",
  "Lion",
  "Shark",
  "Whale",
];

const generateRandomUsername = () => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 90) + 10; // 10-99
  return `${adj}${noun}${num}`.slice(0, 10); // Ensure max 10 chars
};

const checkUsernameAvailability = async (username: string) => {
  try {
    const usernameDoc = await getDoc(
      doc(FIRESTORE_DB, "usernames", username.toLowerCase())
    );
    return !usernameDoc.exists();
  } catch (error) {
    console.error("Error checking username:", error);
    return false;
  }
};

const RegisterScreen: React.FC = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingUsername, setGeneratingUsername] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const db = FIRESTORE_DB;
  const { refreshUserProfile } = useCustomAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = themedStyles(colors);

  // Generate initial username on component mount
  useEffect(() => {
    generateNewUsername();
  }, []);

  // Check username availability when it changes
  useEffect(() => {
    if (username.length > 0) {
      const timer = setTimeout(() => {
        checkUsernameAvailability(username).then(setUsernameAvailable);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [username]);

  const generateNewUsername = async () => {
    setGeneratingUsername(true);
    let newUsername = "";
    let attempts = 0;

    // Try up to 5 times to find an available username
    while (attempts < 5) {
      newUsername = generateRandomUsername();
      const available = await checkUsernameAvailability(newUsername);
      if (available) {
        setUsername(newUsername);
        setUsernameAvailable(true);
        setGeneratingUsername(false);
        return;
      }
      attempts++;
    }

    // If all attempts fail, just use the last generated one with a random suffix
    newUsername = `${newUsername}${Math.floor(Math.random() * 10)}`.slice(
      0,
      10
    );
    setUsername(newUsername);
    setUsernameAvailable(true);
    setGeneratingUsername(false);
  };

  const signUp = async () => {
    if (!acceptedTerms) {
      Alert.alert(
        "Terms Required",
        "You must accept the Privacy Policy to register."
      );
      return;
    }

    setLoading(true);
    try {
      // Final availability check right before registration
      const isAvailable = await checkUsernameAvailability(username);
      if (!isAvailable) {
        Alert.alert("Username Taken", "Please choose a different username.");
        return;
      }

      const response = await createUserWithEmailAndPassword(
        FIREBASE_AUTH,
        email,
        password
      );

      // Save user data and username mapping
      await saveUserData(response.user.uid);
      await setDoc(doc(db, "usernames", username.toLowerCase()), {
        userId: response.user.uid,
      });

      posthog.capture("user_signed_up");
    } catch (error: any) {
      console.log(error);
      Alert.alert("Sign Up Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveUserData = async (userId: string) => {
    try {
      const userRef = doc(db, "users", userId);
      const userData = {
        name: username.trim() || "User",
        email: FIREBASE_AUTH.currentUser?.email,
        username: username.toLowerCase(),
        createdAt: new Date().toISOString(),
      };
      await setDoc(userRef, userData);
      await refreshUserProfile();
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerelement}>
        <Image
          source={require("../../assets/images/blissm.png")}
          style={styles.icon}
        />
        <Text style={styles.title}>Create Your Account</Text>
      </View>

      <TextInput
        autoFocus
        autoCapitalize="none"
        value={email}
        placeholder="Email Address"
        onChangeText={setEmail}
        style={styles.inputItem}
        placeholderTextColor={colors.text}
        cursorColor={colors.text}
      />
      <TextInput
        autoCapitalize="none"
        value={password}
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
        style={styles.inputItem}
        placeholderTextColor={colors.text}
        cursorColor={colors.text}
      />

      <View style={styles.usernameContainer}>
        <TextInput
          autoCapitalize="none"
          placeholder="Username"
          value={username}
          onChangeText={(text) =>
            setUsername(text.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10))
          }
          style={[styles.inputItem, styles.usernameInput]}
          placeholderTextColor={colors.border}
          cursorColor={colors.text}
          maxLength={10}
        />
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={generateNewUsername}
          disabled={generatingUsername}
        >
          {generatingUsername ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Text style={styles.refreshText}>🔄</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.usernameStatus}>
        {username.length > 0 && (
          <Text
            style={[
              styles.statusText,
              { color: usernameAvailable ? colors.primary : "red" },
            ]}
          >
            {usernameAvailable ? "✓ Available" : "✗ Taken"}
          </Text>
        )}
        <Text style={styles.usernameNote}>{username.length}/10 characters</Text>
      </View>

      <Text style={styles.privacyText}>
        🔒 Your username keeps you{" "}
        <Text style={{ fontFamily: "Poppins-Bold" }}>anonymous</Text>. You can
        change it later in settings.
      </Text>

      <View style={styles.termsContainer}>
        <Checkbox
          value={acceptedTerms}
          onValueChange={setAcceptedTerms}
          color={acceptedTerms ? colors.primary : undefined}
        />
        <Text style={styles.termsText}>
          By signing up, you agree to our{" "}
          <Text
            style={styles.linkText}
            onPress={() =>
              Linking.openURL(
                "https://sandip-pathe.github.io/rescue/privacy-policy"
              )
            }
          >
            Privacy Policy
          </Text>
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.text} />
      ) : (
        <TouchableOpacity
          style={[
            styles.btn,
            (!acceptedTerms || !usernameAvailable) && styles.disabledBtn,
          ]}
          onPress={signUp}
          disabled={!acceptedTerms || !usernameAvailable}
        >
          <Text style={styles.btnText}>Sign Up</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.switchScreenButton}
        onPress={() => router.replace("/")}
      >
        <Text style={styles.switchScreenText}>
          Already have an account? Sign In
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default RegisterScreen;

const themedStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 26,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 22,
      color: colors.text,
      fontFamily: "Poppins-Bold",
    },
    headerelement: {
      alignItems: "center",
      gap: 10,
      justifyContent: "center",
      marginVertical: 16,
    },
    inputItem: {
      color: colors.text,
      borderBottomWidth: 1,
      borderColor: colors.primary,
      padding: 5,
      marginBottom: 15,
      fontFamily: "Poppins-Regular",
    },
    usernameInput: {
      flex: 1,
    },
    usernameContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    refreshButton: {
      padding: 8,
    },
    refreshText: {
      fontSize: 18,
    },
    usernameStatus: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 15,
    },
    statusText: {
      fontFamily: "Poppins-Regular",
      fontSize: 12,
    },
    usernameNote: {
      color: colors.border,
      fontFamily: "Poppins-Regular",
      fontSize: 12,
    },
    btn: {
      backgroundColor: colors.primary,
      padding: 10,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 10,
    },
    disabledBtn: {
      backgroundColor: colors.border,
      opacity: 0.6,
    },
    btnText: {
      color: colors.text,
      fontSize: 16,
      fontFamily: "Poppins-Bold",
    },
    privacyText: {
      color: colors.border,
      fontSize: 12,
      fontFamily: "Poppins-Regular",
      marginBottom: 10,
    },
    switchScreenButton: {
      marginTop: 16,
      alignItems: "center",
    },
    switchScreenText: {
      color: colors.primary,
      fontSize: 16,
      fontFamily: "Poppins-Regular",
    },
    icon: {
      backgroundColor: colors.primary,
      width: 40,
      height: 40,
      alignSelf: "center",
      borderRadius: 80,
    },
    termsContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 10,
      gap: 8,
    },
    termsText: {
      fontSize: 12,
      color: colors.text,
      fontFamily: "Poppins-Regular",
      flex: 1,
    },
    linkText: {
      color: colors.primary,
      textDecorationLine: "underline",
    },
  });
