import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { FIREBASE_AUTH, FIRESTORE_DB } from "../../constants/firebaseConf";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useCustomAuth } from "@/components/authContext";
import { posthog } from "@/constants/posthogConfig";
import { useTheme } from "@react-navigation/native";

const RegisterScreen: React.FC = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const db = FIRESTORE_DB;
  const { refreshUserProfile } = useCustomAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = themedStyles(colors);

  const signUp = async () => {
    setLoading(true);
    try {
      const response = await createUserWithEmailAndPassword(
        FIREBASE_AUTH,
        email,
        password
      );
      console.log("User created:", response.user);
      await saveUserData(response.user.uid);
      posthog.capture("user_signed_up");
    } catch (error: any) {
      console.log(error);
      Alert.alert("Sign Up Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationEmail = async () => {
    try {
      const user = FIREBASE_AUTH.currentUser;
      await sendEmailVerification(user as User);
    } catch (error) {
      console.log("Error sending verification email:", error);
    }
  };

  const saveUserData = async (userId: string) => {
    try {
      const userRef = doc(db, "users", userId);
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        const userData = {
          name: username.trim() || "User",
          email: FIREBASE_AUTH.currentUser?.email,
          password,
        };
        await setDoc(userRef, userData);
        console.log("New user data saved to Firestore");
        await refreshUserProfile();
      } else {
        console.log("User data already exists in Firestore");
      }
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

      <TextInput
        autoCapitalize="none"
        placeholder="Username (Optional)"
        onChangeText={setUsername}
        style={styles.inputItem}
        placeholderTextColor={colors.border}
        cursorColor={colors.text}
        maxLength={10}
      />
      <Text style={styles.privacyText}>
        🔒 Your username keeps you{" "}
        <Text style={{ fontFamily: "Poppins-Bold" }}>anonymous</Text>. You can
        change it later in settings.
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.text} />
      ) : (
        <TouchableOpacity style={styles.btn} onPress={signUp}>
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
    btn: {
      backgroundColor: colors.primary,
      padding: 10,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 10,
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
  });
