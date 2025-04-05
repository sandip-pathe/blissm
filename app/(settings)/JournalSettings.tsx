import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ColorPickerModal from "../(modals)/colorPicker";
import { posthog } from "@/constants/posthogConfig";
import { useTheme } from "@react-navigation/native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { FontAwesome } from "@expo/vector-icons";
import ConfirmationModal from "../(modals)/deleteModal";
import { SQLiteDatabase, useSQLiteContext } from "expo-sqlite";
import { deleteTableData } from "@/database/sqlite";

const SettingsScreen: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [fontSize, setFontSize] = useState(16);
  const { colors } = useTheme();
  const styles = themedStyles(colors);
  const colorScheme = useColorScheme();
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const db = useSQLiteContext();

  useEffect(() => {
    loadSettings();
    posthog.capture("journal_settings_viewed");
  }, [colorScheme]);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem("journalSettings");
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        colorScheme === "dark"
          ? setSelectedColor(settings.dark)
          : setSelectedColor(settings.light);
        console.log("colors:", settings.light, settings.dark);
        setFontSize(settings.fontSize ?? 16);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const saveSetting = async (key: string, value: string | number) => {
    try {
      const currentSettingsRaw = await AsyncStorage.getItem("journalSettings");
      const currentSettings = currentSettingsRaw
        ? JSON.parse(currentSettingsRaw)
        : {};

      const updatedSettings = { ...currentSettings, [key]: value };
      await AsyncStorage.setItem(
        "journalSettings",
        JSON.stringify(updatedSettings)
      );
    } catch (error) {
      console.error("Error saving setting:", error);
    }
  };

  const handleColorChange = (color: any) => {
    const selectedColor = colorScheme === "dark" ? color.dark : color.light;
    setSelectedColor(selectedColor);
    saveSetting("dark", color.dark);
    saveSetting("light", color.light);
  };

  const toggleFontSize = () => {
    const newFontSize = fontSize === 16 ? 20 : 16;
    setFontSize(newFontSize);
    saveSetting("fontSize", newFontSize);
  };

  const handleDeleteEntry = async () => {
    try {
      await deleteTableData(db, "journalSessionsTable");
      closeModal();
    } catch (error) {
      console.error("Failed to delete journal session:", error);
    }
  };

  const closeModal = () => {
    setDeleteModalVisible(false);
  };

  return (
    <>
      <View style={styles.container}>
        <View style={[styles.row, { flexDirection: "column" }]}>
          <Text style={styles.label}>Default Background Color</Text>
          <TouchableOpacity
            style={[styles.toggleButton, { backgroundColor: selectedColor }]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.toggleButtonText}>
              {selectedColor || "select color"}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Font Size</Text>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={toggleFontSize}
          >
            <Text style={styles.toggleButtonText}>
              {fontSize === 16 ? "Medium" : "Large"}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setDeleteModalVisible(true)}
        >
          <FontAwesome name="trash-o" size={24} color={"red"} />
          <Text style={[styles.buttonText, { color: "red" }]}>
            Delete All Chats
          </Text>
        </TouchableOpacity>
        <Text style={[styles.infoText, { fontSize: 14 }]}>
          Permanently delete all conversations from your device. You can't undo
          this.
        </Text>
      </View>
      <ColorPickerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onChangeBackgroundColor={handleColorChange}
      />
      <ConfirmationModal
        visible={isDeleteModalVisible}
        title="Delete All Chats"
        message="Are you sure you want to delete all chats?"
        onCancel={closeModal}
        onConfirm={handleDeleteEntry}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
};

export default SettingsScreen;

const themedStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginVertical: 20,
    },
    label: {
      fontSize: 18,
      fontFamily: "Poppins-Bold",
      color: colors.text,
    },
    toggleButton: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 5,
      alignItems: "center",
    },
    toggleButtonText: {
      fontSize: 16,
      color: colors.text,
      fontFamily: "Poppins-Bold",
    },
    infoText: {
      color: colors.border,
      fontFamily: "Poppins-Regular",
      textAlign: "left",
    },
    devider: {
      borderBottomColor: colors.card,
      borderBottomWidth: 1,
      marginVertical: 10,
    },
    button: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 20,
      paddingVertical: 10,
    },
    buttonText: {
      fontSize: 16,
      fontFamily: "Poppins-Regular",
      color: colors.text,
      marginLeft: 10,
    },
  });
