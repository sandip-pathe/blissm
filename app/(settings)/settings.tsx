import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useCustomAuth } from "@/components/authContext";
import { clearAllData, inspectDatabase } from "@/database/sqlite";
import { useSQLiteContext } from "expo-sqlite";
import Avatar from "@/components/Avatar";
import {
  updateUserProfile,
  logoutUser,
  deleteUserAccount,
  clearCacheData,
} from "../../constants/profileHelpers";
import LanguagePreferenceModal from "../(modals)/language";
import { ScrollView } from "react-native-gesture-handler";
import { FIREBASE_AUTH, FIRESTORE_DB } from "../../constants/firebaseConf";
import { posthog } from "@/constants/posthogConfig";
import { useTheme } from "@react-navigation/native";

const Profile: React.FC = () => {
  const { currentUser, refreshUserProfile } = useCustomAuth();
  const router = useRouter();
  const db = useSQLiteContext();
  const auth = FIREBASE_AUTH;
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || "");
  const [contact, setContact] = useState(currentUser?.contact || "");
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const { colors } = useTheme();
  const styles = themedStyles(colors);

  useEffect(() => {
    posthog.capture("settings_viewed");
  }, []);

  const showAlert = (title: string, message: string, actions: any) => {
    Alert.alert(title, message, actions);
  };

  const handleUpdateProfile = async () => {
    setIsEditing(false);
    try {
      await updateUserProfile(
        name,
        contact,
        FIRESTORE_DB,
        auth,
        refreshUserProfile
      );
    } catch (error: any) {
      Alert.alert("Error", "Failed to update profile.");
      console.error(error);
    }
  };

  const handleLogout = () => {
    showAlert(
      "Log Out?",
      "Are you sure you want to log out? You may lose your data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => logoutUser(auth, router),
        },
      ]
    );
  };

  const handleDeleteCache = () => {
    showAlert(
      "Confirm Deletion",
      "Are you sure you want to delete all data? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => clearCacheData(clearAllData, db),
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    setIsDeleting(true);
    showAlert(
      "Delete Account",
      "This will permanently delete your account and all associated data. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () =>
            deleteUserAccount(
              currentUser?.uid,
              FIRESTORE_DB,
              clearAllData,
              db,
              router
            ),
        },
      ]
    );
  };

  const settingsOptions = [
    {
      title: "Chat Settings",
      badge: "Customize your chat experience",
      icon: "chatbox",
      action: () => router.navigate("./chatSettings"),
    },
    {
      title: "Journal Settings",
      badge: "Manage your journal preferences",
      icon: "journal",
      action: () => router.navigate("./JournalSettings"),
    },
    {
      title: "Language Preferences",
      badge: "Choose your preferred language",
      icon: "language",
      action: () => setLanguageModalVisible(true),
    },
    {
      title: "Log Out",
      badge: "Sign out of your account",
      icon: "log-out-sharp",
      action: handleLogout,
      disabled: true,
    },
    {
      title: "Delete Account",
      badge: "Permanently remove your account",
      icon: "close-circle",
      action: handleDeleteAccount,
      disabled: true,
    },
  ];

  return (
    <>
      <ScrollView>
        <View style={styles.itemContainer}>
          <Avatar title={name} imageUrl={""} size={50} />
          <TouchableOpacity
            onPress={() => setIsEditing((prev) => !prev)}
            style={styles.editButton}
          >
            <Text style={styles.nameText}>{name || "User"}</Text>
            <MaterialCommunityIcons
              name="pencil-circle"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>
        {isEditing && (
          <View style={styles.editContainer}>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholder="Set Username"
              cursorColor={colors.text}
              placeholderTextColor={colors.border}
            />
            <TextInput
              value={contact}
              onChangeText={setContact}
              style={styles.input}
              placeholder="Enter Contact Number"
              keyboardType="phone-pad"
              cursorColor={colors.text}
              placeholderTextColor={colors.border}
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdateProfile}
            >
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.settingsList}>
          {!isEditing && (
            <TouchableOpacity
              style={styles.premiumBanner}
              onPress={() => router.navigate("./premium")}
            >
              <Text style={styles.premiumTitle}>🌟 Premium Access</Text>
              <Text style={styles.premiumSubtitle}>
                Exclusive Tools & Features
              </Text>
              <View style={styles.premiumCTA}>
                <Text style={styles.premiumCTAText}>Upgrade Now</Text>
              </View>
            </TouchableOpacity>
          )}
          {settingsOptions.map(
            ({ title, badge, icon, action, disabled }, index) => (
              <TouchableOpacity
                key={index}
                style={styles.settingItem}
                onPress={action}
              >
                <Ionicons
                  name={icon as any}
                  size={24}
                  color={disabled ? colors.border : colors.text}
                />
                <View style={styles.settingLabelContainer}>
                  <Text
                    style={[
                      styles.settingText,
                      disabled && { color: colors.border, fontSize: 16 },
                    ]}
                  >
                    {title}
                  </Text>
                  <Text
                    style={[
                      styles.badgeText,
                      disabled && { color: colors.border, fontSize: 12 },
                    ]}
                  >
                    {badge}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          )}
        </View>
      </ScrollView>
      <LanguagePreferenceModal
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
      />
    </>
  );
};

export default Profile;

const themedStyles = (colors) =>
  StyleSheet.create({
    itemContainer: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      gap: 20,
    },
    editButton: {
      flex: 1,
      flexDirection: "row",
      gap: 10,
      alignItems: "center",
    },
    nameText: {
      color: colors.primary,
      fontSize: 24,
      fontFamily: "Poppins-Bold",
    },
    settingsList: {
      paddingHorizontal: 16,
    },
    settingItem: {
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 15,
    },
    settingLabelContainer: {
      flex: 1,
    },
    settingText: {
      fontSize: 18,
      color: colors.text,
      fontFamily: "Poppins-Regular",
    },
    badgeText: {
      fontSize: 14,
      color: colors.text,
      fontFamily: "Poppins-Regular",
    },
    editContainer: {
      padding: 16,
      backgroundColor: colors.card,
      borderRadius: 10,
      marginHorizontal: 16,
    },
    input: {
      borderWidth: 1,
      borderRadius: 5,
      marginBottom: 10,
      paddingHorizontal: 16,
      color: colors.text,
      borderColor: colors.primary,
      fontFamily: "Poppins-Regular",
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 5,
      padding: 10,
      alignItems: "center",
    },
    saveText: {
      color: colors.text,
      textAlign: "center",
      fontSize: 16,
      fontFamily: "Poppins-Regular",
    },
    premiumBanner: {
      marginVertical: 16,
      padding: 16,
      backgroundColor: colors.primary,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    premiumTitle: {
      fontSize: 22,
      fontFamily: "Poppins-Bold",
      color: colors.text,
    },
    premiumSubtitle: {
      fontSize: 14,
      color: colors.text,
      fontFamily: "Poppins-Regular",
    },
    premiumCTA: {
      marginTop: 10,
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: colors.primary,
      borderRadius: 20,
    },
    premiumCTAText: {
      fontSize: 16,
      fontFamily: "Poppins-Bold",
      color: colors.text,
    },
  });
