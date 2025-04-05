import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import { FIREBASE_AUTH } from "@/constants/firebaseConf";
import { posthog } from "@/constants/posthogConfig";
import { useTheme } from "@react-navigation/native";

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors } = useTheme();
  const styles = themedStyles(colors);
  const [email, setEmail] = useState("");
  console.log("ForgotPasswordModal");
  const sendResetEmail = async () => {
    try {
      await sendPasswordResetEmail(FIREBASE_AUTH, email);
      alert("Password reset email sent. Please check your inbox.");
      posthog.capture("password_reset_email_sent");
      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to send password reset email. Please try again later.");
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.header}>Reset Password</Text>
          <Text style={styles.text}>
            Enter your email address to receive a password reset link.
          </Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email address"
            autoCapitalize="none"
            cursorColor={colors.border}
            placeholderTextColor={colors.border}
            keyboardType="email-address"
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={sendResetEmail}>
              <Text style={styles.buttonText}>Send Reset Email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ForgotPasswordModal;

const themedStyles = (colors) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(1, 1, 1, 0.5)",
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 20,
      width: "90%",
      color: colors.text,
    },
    header: {
      fontSize: 20,
      fontFamily: "Poppins-Bold",
      textAlign: "center",
      marginBottom: 20,
      color: colors.text,
    },
    input: {
      borderBottomWidth: 1,
      borderColor: colors.primary,
      padding: 10,
      marginBottom: 20,
      color: colors.text,
      fontFamily: "Poppins-Regular",
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    button: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 10,
      backgroundColor: colors.primary,
    },
    buttonText: {
      color: colors.text,
      fontSize: 14,
      fontFamily: "Poppins-Regular",
      textAlign: "center",
    },
    text: {
      marginBottom: 20,
      color: colors.text,
      fontFamily: "Poppins-Regular",
    },
  });
