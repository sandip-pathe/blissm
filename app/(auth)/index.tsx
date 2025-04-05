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
import { FIREBASE_AUTH } from "@/constants/firebaseConf";
import { signInWithEmailAndPassword } from "firebase/auth";
import ForgotPasswordModal from "../(modals)/forgotPasswordModal";
import { useTheme } from "@react-navigation/native";

const index = () => {
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggleForgotPasswordModal = () => {
    setShowForgotPasswordModal((prev) => !prev);
  };
  const { colors } = useTheme();
  const styles = themedStyles(colors);

  const signIn = async () => {
    setLoading(true);
    try {
      const response = await signInWithEmailAndPassword(
        FIREBASE_AUTH,
        email,
        password
      );
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
      <Image
        source={require("../../assets/images/blissm.png")}
        style={styles.icon}
      />
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
      {loading ? (
        <ActivityIndicator size="large" color={colors.text} />
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
        onPress={() => router.replace("./register")}
      >
        <Text style={styles.switchScreenText}>
          Don't have an account? Sign Up
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default index;

const themedStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 26,
      backgroundColor: colors.background,
    },
    icon: {
      backgroundColor: colors.primary,
      width: 80,
      height: 80,
      alignSelf: "center",
      marginBottom: 40,
      borderRadius: 80,
    },
    inputItem: {
      color: colors.text,
      borderBottomWidth: 1,
      borderColor: colors.border,
      padding: 5,
      marginBottom: 20,
      fontFamily: "Poppins-Regular",
    },
    btn: {
      backgroundColor: colors.primary,
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
    },
    btnText: {
      color: colors.text,
      fontSize: 16,
      fontFamily: "Poppins-Bold",
    },
    forgotText: {
      color: colors.text,
      textAlign: "right",
      marginVertical: 10,
    },
    switchScreenButton: {
      marginTop: 30,
      alignItems: "center",
    },
    switchScreenText: {
      color: colors.primary,
      fontSize: 16,
    },
  });
