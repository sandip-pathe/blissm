import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";

interface DisclaimerModalProps {
  visible: boolean;
  onDismiss: () => void;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({
  visible,
  onDismiss,
}) => {
  const { colors } = useTheme();
  const styles = themedStyles(colors);
  return (
    <Modal visible={visible} transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.handle} />
          <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Disclaimer & Privacy Notice</Text>
          <Text style={styles.message}>
            • Blissm is designed for informational and supportive purposes only.
            {"\n"}• It is not a substitute for professional mental health care
            or advice.{"\n"}• All conversations are stored locally and remain
            private.{"\n"}• Please review our full Privacy Policy and Terms of
            Service for additional details.{"\n"}• For any questions or
            concerns, contact our support team.
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Privacy Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onDismiss}
            >
              <Text style={styles.buttonText}>Got It</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.additionalLinks}>
            <TouchableOpacity>
              <Text style={styles.linkText}>Terms of Service</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.linkText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DisclaimerModal;

const themedStyles = (colors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
    },
    handle: {
      width: 80,
      height: 5,
      backgroundColor: colors.border,
      borderRadius: 2.5,
      alignSelf: "center",
      marginVertical: 8,
      marginBottom: 20,
    },
    modalContainer: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 16,
      paddingBottom: 30,
    },
    title: {
      fontSize: 16,
      fontFamily: "Poppins-Bold",
      color: colors.text,
      marginBottom: 10,
      textAlign: "center",
    },
    message: {
      fontSize: 14,
      fontFamily: "Poppins-Regular",
      color: colors.text,
      marginBottom: 20,
      textAlign: "left",
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 15,
    },
    button: {
      backgroundColor: colors.border,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 5,
    },
    secondaryButton: {
      backgroundColor: colors.primary,
    },
    buttonText: {
      color: colors.text,
      fontSize: 14,
      fontFamily: "Poppins-Regular",
    },
    additionalLinks: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    linkText: {
      color: colors.border,
      fontSize: 14,
      textDecorationLine: "underline",
      marginHorizontal: 10,
      fontFamily: "Poppins-Regular",
    },
    closeButton: {
      position: "absolute",
      right: 20,
      top: 15,
    },
  });
