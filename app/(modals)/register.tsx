import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import Colors from "@/constants/Colors";
import { FIREBASE_AUTH, FIRESTORE_DB } from "@/FirebaseConfig";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useCustomAuth } from "@/components/authContext";

const RegisterScreen: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = FIREBASE_AUTH;
  const db = FIRESTORE_DB;
  const { refreshUserProfile } = useCustomAuth();
  const router = useRouter();

  const signUp = async () => {
    setLoading(true);
    try {
      const response = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("User created:", response.user);
      await saveUserData(response.user.uid);
      await sendVerificationEmail();
      Alert.alert(
        "Sign Up Successful",
        "A verification email has been sent to your address. Please verify your email before signing in."
      );
      router.replace("/login");
    } catch (error: any) {
      console.log(error);
      Alert.alert("Sign Up Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationEmail = async () => {
    try {
      const user = auth.currentUser;
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
        const userData = { name, email: auth.currentUser?.email, password };
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
      <Stack.Screen options={{ headerShown: true, title: "Register" }} />
      <TextInput
        autoCapitalize="none"
        placeholder="Name"
        onChangeText={setName}
        style={styles.inputItem}
        placeholderTextColor={Colors.light}
        cursorColor={Colors.light}
      />
      <TextInput
        autoCapitalize="none"
        value={email}
        placeholder="Email Address"
        onChangeText={setEmail}
        style={styles.inputItem}
        placeholderTextColor={Colors.light}
        cursorColor={Colors.light}
      />
      <TextInput
        autoCapitalize="none"
        value={password}
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
        style={styles.inputItem}
        placeholderTextColor={Colors.light}
        cursorColor={Colors.light}
      />
      {loading ? (
        <ActivityIndicator size="large" color={Colors.light} />
      ) : (
        <TouchableOpacity style={styles.btn} onPress={signUp}>
          <Text style={styles.btnText}>Sign Up</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.switchScreenButton}
        onPress={() => router.push("/login")}
      >
        <Text style={styles.switchScreenText}>
          Already have an account? Sign In
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 26,
    paddingTop: 60,
    backgroundColor: Colors.primary,
  },
  inputItem: {
    color: Colors.light,
    borderBottomWidth: 1,
    borderColor: Colors.primary,
    padding: 5,
    marginBottom: 20,
    fontFamily: "Poppins-Regular",
  },
  btn: {
    backgroundColor: Colors.accent2,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: {
    color: Colors.light,
    fontSize: 16,
    fontFamily: "Poppins-Bold",
  },
  switchScreenButton: {
    marginTop: 20,
    alignItems: "center",
  },
  switchScreenText: {
    color: Colors.accent2,
    fontSize: 16,
  },
});
