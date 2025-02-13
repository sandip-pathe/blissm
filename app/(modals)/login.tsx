// LoginScreen.tsx
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
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { FIREBASE_AUTH } from "@/FirebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import ForgotPasswordModal from "../(modals)/forgotPasswordModal";
import { useCustomAuth } from "@/components/authContext";

const LoginScreen: React.FC = () => {
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = FIREBASE_AUTH;
  const { refreshUserProfile } = useCustomAuth();
  const router = useRouter();

  const toggleForgotPasswordModal = () => {
    setShowForgotPasswordModal((prev) => !prev);
  };

  const signIn = async () => {
    setLoading(true);
    try {
      const response = await signInWithEmailAndPassword(auth, email, password);
      console.log("Sign-in successful:", response);
    } catch (error: any) {
      console.log(error);
      Alert.alert("Sign In Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: "Login" }} />
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
        secureTextEntry={true}
        onChangeText={setPassword}
        style={styles.inputItem}
        placeholderTextColor={Colors.light}
        cursorColor={Colors.light}
      />
      {loading ? (
        <ActivityIndicator size="large" color={Colors.light} />
      ) : (
        <TouchableOpacity style={styles.btn} onPress={signIn}>
          <Text style={styles.btnText}>Sign In</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={toggleForgotPasswordModal}>
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>
      <ForgotPasswordModal
        visible={showForgotPasswordModal}
        onClose={toggleForgotPasswordModal}
      />
      <TouchableOpacity
        style={styles.switchScreenButton}
        onPress={() => router.push("/register")}
      >
        <Text style={styles.switchScreenText}>
          Don't have an account? Sign Up
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;

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
    borderColor: Colors.accent2,
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
  forgotText: {
    color: Colors.light,
    textAlign: "right",
    marginVertical: 30,
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
