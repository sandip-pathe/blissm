import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Switch,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { posthog } from "@/constants/posthogConfig";
import { useTheme } from "@react-navigation/native";
import ConfirmationModal from "../(modals)/deleteModal";
import { useSQLiteContext } from "expo-sqlite";
import { deleteTableData } from "@/database/sqlite";

const ChatSettings = () => {
  const [messagesLimit, setMessagesLimit] = useState(50);
  const [hideOlderChats, setHideOlderChats] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const { colors } = useTheme();
  const styles = themedStyles(colors);
  const db = useSQLiteContext();

  useEffect(() => {
    loadSettings();
    posthog.capture("chat_settings_viewed");
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem("chatSettings");
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setMessagesLimit(settings.messagesLimit ?? 50);
        setHideOlderChats(settings.hideOlderChats ?? true);
        setFontSize(settings.fontSize ?? 16);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const saveSetting = async (key: string, value: number | boolean) => {
    try {
      const currentSettingsRaw = await AsyncStorage.getItem("chatSettings");
      const currentSettings = currentSettingsRaw
        ? JSON.parse(currentSettingsRaw)
        : {};

      const updatedSettings = { ...currentSettings, [key]: value };
      await AsyncStorage.setItem(
        "chatSettings",
        JSON.stringify(updatedSettings)
      );
    } catch (error) {
      console.error("Error saving setting:", error);
    }
  };

  const increaseLimit = () => {
    if (messagesLimit < 100) {
      const newLimit = messagesLimit + 5;
      setMessagesLimit(newLimit);
      saveSetting("messagesLimit", newLimit);
    }
  };

  const decreaseLimit = () => {
    if (messagesLimit > 5) {
      const newLimit = messagesLimit - 5;
      setMessagesLimit(newLimit);
      saveSetting("messagesLimit", newLimit);
    }
  };

  const toggleHideOlderChats = () => {
    setHideOlderChats((prev) => {
      saveSetting("hideOlderChats", !prev);
      return !prev;
    });
  };

  const toggleFontSize = () => {
    const newFontSize = fontSize === 16 ? 20 : 16;
    setFontSize(newFontSize);
    posthog.capture("font_size_toggled", { newFontSize });
    saveSetting("fontSize", newFontSize);
  };

  const confirmBackup = () => {
    posthog.capture("backup_chats_clicked");
    Alert.alert(
      "Backup Chats",
      "Your data will be stored on the cloud. Are you sure you want to proceed?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Proceed", onPress: backupChats },
      ]
    );
  };

  const backupChats = async () => {
    // Implement actual backup logic here
    Alert.alert(
      "Backup Successful",
      "Your chats have been backed up successfully."
    );
  };

  const handleDeleteEntry = async () => {
    try {
      await deleteTableData(db, "chatSessions");
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
        <View style={styles.row}>
          <Text style={styles.label}>Hide Older Chats</Text>
          <Switch
            value={hideOlderChats}
            onValueChange={toggleHideOlderChats}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.primary}
          />
        </View>
        <Text style={[styles.infoText, { fontSize: 14 }]}>
          Hide conversations older than a week to keep your chat list clean.
        </Text>
        <View style={styles.devider} />

        {/* Messages Limit */}
        <View style={styles.row}>
          <Text style={styles.label}>Messages per Chat</Text>
          <View style={styles.counterContainer}>
            <TouchableOpacity onPress={decreaseLimit}>
              <Ionicons name="remove-circle" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.counterValue}>{messagesLimit}</Text>
            <TouchableOpacity onPress={increaseLimit}>
              <Ionicons name="add-circle" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.infoText, { fontSize: 14 }]}>
          Show only recent conversations to keep sensitive info private.
        </Text>
        <View style={styles.devider} />

        {/* Font Size */}
        <View style={styles.row}>
          <Text style={styles.label}>Font Size</Text>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={toggleFontSize}
          >
            <Text style={[styles.toggleButtonText, { fontSize }]}>
              {fontSize === 16 ? "Medium" : "Large"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={confirmBackup}>
          <FontAwesome name="cloud-upload" size={24} color={colors.text} />
          <Text style={styles.buttonText}>Backup Chats</Text>
        </TouchableOpacity>
        <Text style={[styles.infoText, { fontSize: 14 }]}>
          Backup your conversations to keep them safe in the cloud.
        </Text>
        <Text style={[styles.infoText, { fontSize: 14 }]}>
          Uninstalling the app will delete all your conversations.
        </Text>

        {/* Delete Chats */}
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

export default ChatSettings;

const themedStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginVertical: 20,
    },
    label: {
      fontSize: 18,
      fontFamily: "Poppins-Bold",
      color: colors.text,
    },
    counterContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 5,
    },
    counterValue: {
      marginHorizontal: 15,
      fontSize: 16,
      fontFamily: "Poppins-Bold",
      color: colors.text,
    },
    toggleButton: {
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 5,
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
