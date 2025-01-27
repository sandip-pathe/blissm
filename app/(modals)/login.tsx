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
import Colors from "@/constants/Colors";
import { FIREBASE_AUTH, FIRESTORE_DB } from "../../FirebaseConfig";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import ForgotPasswordModal from "../(modals)/forgotPasswordModal";

const AdminLogin = () => {
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = FIREBASE_AUTH;
  const db = FIRESTORE_DB;

  const toggleForgotPasswordModal = () => {
    setShowForgotPasswordModal(!showForgotPasswordModal);
  };

  const signIn = async () => {
    setLoading(true);
    try {
      const response = await signInWithEmailAndPassword(auth, email, password);
      console.log(response);
      if (!response.user) {
        throw new Error("User not found");
      }
    } catch (error: any) {
      console.log(error);
      Alert.alert("Sign In Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async () => {
    setLoading(true);
    try {
      const response = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log(response);
      sendVerificationEmail();
      saveUserData(response.user.uid);
      Alert.alert(
        "Sign Up Successful",
        "A verification email has been sent to your email address. Please verify your email before signing in."
      );
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
        const userData = {
          email: auth.currentUser?.email,
          // Add any additional user data you want to store
        };
        await setDoc(userRef, userData);
        console.log("New user data saved to Firestore");
      } else {
        console.log("User data already exists in Firestore");
      }
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <View style={{ gap: 20 }}>
          <TextInput
            autoCapitalize="none"
            value={email}
            placeholder="Email Address"
            onChangeText={(text) => setEmail(text)}
            style={styles.inputItem}
            placeholderTextColor={Colors.light}
            cursorColor={Colors.light}
          />
          <TextInput
            autoCapitalize="none"
            value={password}
            placeholder="Password"
            secureTextEntry={true}
            onChangeText={(text) => setPassword(text)}
            style={styles.inputItem}
            placeholderTextColor={Colors.light}
            cursorColor={Colors.light}
          />
          {loading ? (
            <ActivityIndicator size="large" color={Colors.light} />
          ) : (
            <>
              <TouchableOpacity style={styles.btn} onPress={signIn}>
                <Text style={styles.btnText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnOutline} onPress={signUp}>
                <Text style={styles.btnOutlineText}>Sign Up</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
            paddingVertical: 30,
          }}
        >
          <TouchableOpacity onPress={toggleForgotPasswordModal}>
            <Text style={{ color: Colors.light }}>Forgot Password?</Text>
          </TouchableOpacity>
          <ForgotPasswordModal
            visible={showForgotPasswordModal}
            onClose={toggleForgotPasswordModal}
          />
        </View>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            gap: 40,
            margin: 60,
          }}
        ></View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 26,
    paddingTop: 60,
  },
  inputItem: {
    color: Colors.light,
    borderBottomWidth: 1,
    borderColor: Colors.light,
    padding: 5,
    marginBottom: 20,
  },
  btn: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: {
    color: Colors.light,
    fontSize: 16,
    fontWeight: "bold",
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnOutlineText: {
    color: Colors.light,
    fontSize: 16,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light,
  },
});

export default AdminLogin;
