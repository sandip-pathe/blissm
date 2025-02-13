import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { FIREBASE_AUTH, FIRESTORE_DB } from "@/FirebaseConfig";
import { useCustomAuth } from "@/components/authContext";
import { clearAllData } from "@/database/sqlite";
import { useSQLiteContext } from "expo-sqlite";
import Avatar from "@/components/Avatar";

import {
  updateUserProfile,
  logoutUser,
  deleteUserAccount,
  clearCacheData,
} from "./profileHelpers";

const Profile: React.FC = () => {
  const { currentUser, refreshUserProfile } = useCustomAuth();
  const router = useRouter();
  const db = useSQLiteContext();
  const auth = FIREBASE_AUTH;

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(currentUser?.fullName || "");
  const [contact, setContact] = useState(currentUser?.contact || "");

  useEffect(() => {
    console.log(currentUser);
  }, [currentUser]);

  const handleUpdateProfile = async () => {
    try {
      await updateUserProfile(
        fullName,
        contact,
        FIRESTORE_DB,
        auth,
        refreshUserProfile
      );
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully.");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile.");
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Log Out?",
      "Are you sure you want to log out? You may lose your data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await logoutUser(auth, router);
            } catch (error) {
              Alert.alert("Error", "Failed to sign out.");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteCache = () => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete all data? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await clearCacheData(clearAllData, db);
              Alert.alert("Success", "All data has been deleted.");
            } catch (error) {
              Alert.alert("Error", "Failed to delete data.");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all associated data. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteUserAccount(
                auth,
                FIRESTORE_DB,
                clearAllData,
                db,
                router
              );
            } catch (error) {
              Alert.alert("Error", "Failed to delete account.");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Settings" }} />
      <View style={styles.itemContainer}>
        <View>
          <Avatar title={fullName} imageUrl={""} size={50} />
        </View>
        <TouchableOpacity
          onPress={() => setIsEditing(true)}
          style={styles.editButton}
        >
          <Text style={styles.nameText}>{fullName || "Set Name"}</Text>
          <MaterialCommunityIcons
            name="pencil-circle"
            size={24}
            color={Colors.accent}
          />
        </TouchableOpacity>
      </View>
      {isEditing && (
        <View style={styles.editContainer}>
          <TextInput
            autoFocus
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
            placeholder="Enter Full Name"
            cursorColor={Colors.light}
            placeholderTextColor={Colors.greyLight}
          />
          <TextInput
            value={contact}
            onChangeText={setContact}
            style={styles.input}
            placeholder="Enter Contact Number"
            keyboardType="phone-pad"
            cursorColor={Colors.light}
            placeholderTextColor={Colors.greyLight}
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
        <View style={styles.settingItem}>
          <Ionicons name="moon" size={24} color={Colors.light} />
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingText}>Dark Mode</Text>
          </View>
          <Switch
            value={isDarkMode}
            style={styles.switchStyle}
            onValueChange={() => setIsDarkMode(!isDarkMode)}
          />
        </View>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleDeleteCache}
          disabled={isDeleting}
        >
          <Ionicons name="trash-bin" size={24} color={Colors.light} />
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingText}>Clear Cache</Text>
            <Text style={styles.badgeText}>Delete all SQL data</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
          <Ionicons name="log-out-sharp" size={24} color={Colors.light} />
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingText}>Log Out</Text>
            <Text style={styles.badgeText}>Sign out of your account</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleDeleteAccount}
          disabled
        >
          <Ionicons name="close-circle" size={24} color="red" />
          <View style={styles.settingLabelContainer}>
            <Text style={[styles.settingText, { color: "red" }]}>
              Delete Account
            </Text>
            <Text style={[styles.badgeText, { color: "red" }]}>
              Permanently remove your account
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default Profile;

const styles = StyleSheet.create({
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
    color: Colors.accent,
    fontSize: 24,
    fontWeight: "bold",
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
    color: Colors.light,
  },
  badgeText: {
    fontSize: 14,
    color: Colors.light,
  },
  editContainer: {
    padding: 16,
  },
  input: {
    borderBottomWidth: 1,
    marginBottom: 10,
    padding: 8,
    color: Colors.light,
    backgroundColor: Colors.secondary,
    borderColor: Colors.accent2,
    borderWidth: 1,
    borderRadius: 5,
  },
  saveButton: {
    backgroundColor: Colors.accent2,
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
  },
  saveText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
  },
  switchStyle: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
  },
});
