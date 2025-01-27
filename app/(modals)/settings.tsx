import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import Colors from "../../constants/Colors";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { User, getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { FIREBASE_APP, FIREBASE_AUTH } from "@/FirebaseConfig";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { useCustomAuth } from "@/components/authContext";
import { clearAllData } from "@/database/sqlite";
import { useSQLiteContext } from "expo-sqlite";
const firestore = getFirestore(FIREBASE_APP);

interface AdminProfile {
  fullName: string;
  email: string;
}

const Profile = () => {
  const { currentUser, loading, error } = useCustomAuth();
  const db = useSQLiteContext();

  const auth = FIREBASE_AUTH;

  const router = useRouter();

  const handleToggleDarkMode = () => {
    // Implement logic to toggle dark mode
    alert("Functionality not implemented yet");
  };

  const handleLanguageSetting = () => {
    // Implement logic to change app language
    alert("functionality not implemented yet");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // router.replace("../(modals)/login"); // This is the original line but in our case it is automatically handled by the onAuthStateChanged listener in _layout.tsx
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };
  const handleDelete = async () => {
    try {
      await clearAllData(db);
      Alert.alert(`all data has been deleted.`);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
        }}
      />

      <View style={styles.itemContainer}>
        <MaterialCommunityIcons
          name="account-circle"
          size={40}
          color={Colors.gold}
          style={{
            padding: 0,
            borderWidth: 1,
            borderColor: Colors.gold,
            borderRadius: 50,
          }}
        />
        <TouchableOpacity
          onPress={() => router.navigate("/CustomUser/AdminProfile")}
          style={styles.detailsContainer}
        >
          {currentUser?.fullName && (
            <Text style={styles.nameText}>{currentUser?.fullName}</Text>
          )}
          <Text style={styles.nameText}>Sandip Pathe</Text>
          <View style={styles.infoContainer}>
            <View style={styles.badgeContainer}>
              <Text style={[styles.badgeText, { fontSize: 10 }]}>
                {currentUser?.email ? currentUser?.email : "User"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnOutline}
          onPress={() => router.navigate("/CustomUser/UpdateAdminProfile")}
        >
          <Text style={styles.btnOutlineText}>Edit</Text>
        </TouchableOpacity>
      </View>
      <View
        style={{
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderColor: Colors.greyLightLight,
          marginVertical: 10,
        }}
      />

      <View style={styles.settingsList}>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleToggleDarkMode}
        >
          <MaterialIcons name="dark-mode" size={24} color={Colors.light} />
          <View>
            <Text style={styles.settingText}>Dark Mode</Text>
            <Text style={styles.badgeText}>Toggle dark mode on or off</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleLanguageSetting}
        >
          <Ionicons name="language" size={24} color={Colors.light} />
          <View>
            <Text style={styles.settingText}>Language</Text>
            <Text style={styles.badgeText}>Change app language</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            alert("Functionality not implemented yet");
          }}
        >
          <Ionicons name="information-circle" size={24} color={Colors.light} />
          <View>
            <Text style={styles.settingText}>About</Text>
            <Text style={styles.badgeText}>About Blissm</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem} onPress={handleDelete}>
          <Ionicons name="trash-bin" size={24} color={Colors.light} />
          <View>
            <Text style={styles.settingText}>Clear Cache</Text>
            <Text style={styles.badgeText}>Delete all Sql data</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
          <Ionicons name="log-out-sharp" size={24} color={Colors.light} />
          <View>
            <Text style={styles.settingText}>Log Out</Text>
            <Text style={styles.badgeText}>Log Out</Text>
          </View>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default Profile;

const styles = StyleSheet.create({
  btnOutline: {
    borderColor: Colors.gold,
    borderWidth: 1,
    height: 30,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
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
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 16,
    marginRight: 16,
  },
  nameText: {
    color: Colors.gold,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    flexShrink: 1,
  },
  infoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeContainer: {
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 14,
    color: Colors.light,
  },
  settingsList: {
    paddingHorizontal: 16,
  },
  settingItem: {
    paddingVertical: 10,
    flexDirection: "row",
    gap: 20,
    alignItems: "center",
  },
  settingText: {
    fontSize: 18,
    color: Colors.light,
  },
});
