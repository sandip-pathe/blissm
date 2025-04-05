import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";

interface ConfirmationModalProps {
  visible: boolean;
  title?: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title = "Confirm Action",
  message,
  onCancel,
  onConfirm,
  confirmText = "Delete",
  cancelText = "Cancel",
}) => {
  const { colors } = useTheme();
  const styles = themedStyles(colors);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {title && <Text style={styles.header}>{title}</Text>}
          <Text style={styles.text}>{message}</Text>
          <View style={styles.buttonContainer}>
            <Text style={styles.buttonText} onPress={onCancel}>
              {cancelText}
            </Text>
            <Text style={styles.confirmButtonText} onPress={onConfirm}>
              {confirmText}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmationModal;

const themedStyles = (colors: any) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 15,
      padding: 20,
      width: "85%",
      alignItems: "center",
    },
    header: {
      fontSize: 18,
      fontFamily: "Poppins-Bold",
      textAlign: "center",
      color: colors.text,
      marginBottom: 10,
    },
    text: {
      fontSize: 14,
      fontFamily: "Poppins-Regular",
      color: colors.border,
      textAlign: "center",
      marginBottom: 20,
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
    },
    buttonText: {
      fontSize: 14,
      fontFamily: "Poppins-Regular",
      color: colors.primary,
    },
    confirmButtonText: {
      fontSize: 14,
      fontFamily: "Poppins-Regular",
      color: colors.primary,
    },
  });
