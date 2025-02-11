import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  FlatList,
  Modal,
  TextInput,
} from "react-native";
import React, { useState, useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { signOut, deleteUser } from "firebase/auth";
import { FIREBASE_APP, FIREBASE_AUTH, FIRESTORE_DB } from "@/FirebaseConfig";
import { useCustomAuth } from "@/components/authContext";
import { clearAllData } from "@/database/sqlite";
import { SQLiteDatabase, useSQLiteContext } from "expo-sqlite";
import Colors from "../../constants/Colors";
import { getFirestore, doc, updateDoc, deleteDoc } from "firebase/firestore";
import Avatar from "@/components/Avatar";

const Profile = () => {
  const { currentUser, refreshUserProfile } = useCustomAuth();
  const router = useRouter();
  const db = useSQLiteContext();
  const auth = FIREBASE_AUTH;

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(currentUser?.fullName || "");
  const [contact, setContact] = useState(currentUser?.contact || "");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  const avatars = ["flower", "flower-tulip", "tree"];

  const handleUpdateProfile = async () => {
    setIsEditing(false);
    if (!fullName.trim()) {
      Alert.alert("Error", "Name cannot be empty.");
      return;
    }
    try {
      const userRef = doc(FIRESTORE_DB, "users", auth.currentUser!.uid);
      await updateDoc(userRef, { fullName, contact });
      await refreshUserProfile();
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully.");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile.");
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "LogOut?",
      "Are you sure you want to log out? You may lose your data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await signOut(auth);
              router.replace("/(modals)/login");
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

  const handleDelete = async () => {
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
              await clearAllData(db);
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

  const handleDeleteAccount = async () => {
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
              const user = auth.currentUser;
              if (user) {
                const userRef = doc(FIRESTORE_DB, "users", user.uid);
                await deleteDoc(userRef);
                await deleteUser(user);
                await clearAllData(db);
                router.replace("/(modals)/login");
              }
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
        <TouchableOpacity onPress={() => setIsModalVisible(true)}>
          <Avatar title={fullName} imageUrl={""} size={50} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsEditing(true)}
          style={{
            flex: 1,
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
          }}
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
          <View style={{ flex: 1 }}>
            <Text style={styles.settingText}>Dark Mode</Text>
          </View>
          <Switch
            value={isDarkMode}
            style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
            onValueChange={() => setIsDarkMode(!isDarkMode)}
          />
        </View>

        {/* Clear Cache */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleDelete}
          disabled={isDeleting}
        >
          <Ionicons name="trash-bin" size={24} color={Colors.light} />
          <View>
            <Text style={styles.settingText}>Clear Cache</Text>
            <Text style={styles.badgeText}>Delete all SQL data</Text>
          </View>
        </TouchableOpacity>

        {/* Log Out */}
        <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
          <Ionicons name="log-out-sharp" size={24} color={Colors.light} />
          <View>
            <Text style={styles.settingText}>Log Out</Text>
            <Text style={styles.badgeText}>Sign out of your account</Text>
          </View>
        </TouchableOpacity>

        {/* Delete Account */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleDeleteAccount}
        >
          <Ionicons name="close-circle" size={24} color="red" />
          <View>
            <Text style={[styles.settingText, { color: "red" }]}>
              Delete Account
            </Text>
            <Text style={[styles.badgeText, { color: "red" }]}>
              Permanently remove your account
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        style={styles.modalContainer}
        transparent
      >
        <View style={styles.modalContent}>
          <TouchableOpacity
            style={{ padding: 10 }}
            onPress={() => setIsModalVisible(false)}
          >
            <Ionicons name="close" size={24} color={Colors.light} />
          </TouchableOpacity>
          <FlatList
            numColumns={8}
            data={avatars}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setSelectedAvatar(item);
                  setIsModalVisible(false);
                }}
              >
                <MaterialCommunityIcons
                  name={item as any}
                  size={30}
                  color={selectedAvatar === item ? Colors.primary : Colors.pink}
                  style={{ padding: 10 }}
                />
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </>
  );
};

export default Profile;

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: Colors.lightPink,
    borderRadius: 10,
    marginVertical: "auto",
    marginHorizontal: 20,
    width: "auto",
    height: "50%",
  },
  modalContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  btnOutline: {
    borderColor: Colors.gold,
    borderWidth: 1,
    height: 30,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  btnOutlineText: {
    color: Colors.light,
    fontSize: 16,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 20,
    justifyContent: "flex-start",
  },
  detailsContainer: {
    marginLeft: 16,
    marginRight: 16,
  },
  nameText: {
    color: Colors.accent,
    fontSize: 24,
    fontWeight: "bold",
  },
  emailText: {
    color: Colors.light,
    fontSize: 14,
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
    borderColor: Colors.accent2,
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
  },
  saveText: {
    color: "white",
    textAlign: "center",
  },
});
