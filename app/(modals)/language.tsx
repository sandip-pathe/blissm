import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TextInput,
} from "react-native";
import { posthog } from "@/constants/posthogConfig";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";

const availableLanguages = ["English", "Hindi", "Marathi"];

interface LanguagePreferenceModalProps {
  visible: boolean;
  onClose: () => void;
}

const LanguagePreferenceModal: React.FC<LanguagePreferenceModalProps> = ({
  visible,
  onClose,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const { colors } = useTheme();
  const styles = themedStyles(colors);
  const handleSubmit = () => {
    if (selectedLanguage !== "English") {
      posthog.capture("language_interest", { language: selectedLanguage });
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.closeButtonContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Language Preference</Text>
          <Text style={styles.message}>
            Currently, English is the only supported language. However, we'd
            love to know which language you'd like to see in the future. Select
            your preference below:
          </Text>
          {availableLanguages.map((lang) => (
            <TouchableOpacity
              key={lang}
              onPress={() => setSelectedLanguage(lang)}
              style={[
                styles.button,
                {
                  backgroundColor:
                    selectedLanguage === lang ? colors.primary : colors.card,
                },
              ]}
            >
              <Text style={styles.buttonText}>{lang}</Text>
            </TouchableOpacity>
          ))}
          <TextInput
            style={[
              styles.button,
              {
                borderColor: colors.primary,
                color: colors.text,
                borderWidth: 1,
                justifyContent: "center",
                textAlign: "center",
              },
            ]}
            placeholder="Other (please specify)"
            cursorColor={colors.text}
            placeholderTextColor={colors.border}
            onChangeText={(text) => setSelectedLanguage(text)}
          />

          <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default LanguagePreferenceModal;

const themedStyles = (colors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      justifyContent: "center",
      alignItems: "center",
      width: "80%",
      borderRadius: 10,
      backgroundColor: colors.card,
      padding: 20,
    },
    title: {
      fontSize: 18,
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
      textAlign: "justify",
    },
    button: {
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 5,
      marginVertical: 5,
      width: "100%",
      alignItems: "center",
    },
    submitButton: {
      backgroundColor: colors.primary,
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 5,
      marginTop: 10,
      width: "100%",
      alignItems: "center",
    },
    closeButton: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      width: 30,
      height: 30,
      justifyContent: "center",
      alignItems: "center",
    },
    buttonText: {
      color: colors.text,
      fontSize: 14,
      fontFamily: "Poppins-Regular",
    },
    closeButtonContainer: {
      alignSelf: "flex-end",
      marginRight: 26,
      marginBottom: 6,
    },
  });
