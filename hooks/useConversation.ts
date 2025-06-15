import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { UserProfile } from "../types/agents";

const USER_ID_KEY = "blissm_user_id";
const PROFILE_KEY_PREFIX = "blissm_profile_";

export const useUser = () => {
  const [userId, setUserId] = useState<string>("");
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const initializeUser = async () => {
      // Get or create user ID
      let storedUserId = await SecureStore.getItemAsync(USER_ID_KEY);
      if (!storedUserId) {
        storedUserId = `user_${Date.now()}`;
        await SecureStore.setItemAsync(USER_ID_KEY, storedUserId);
      }
      setUserId(storedUserId);

      // Load profile
      const profileKey = `${PROFILE_KEY_PREFIX}${storedUserId}`;
      const storedProfile = await SecureStore.getItemAsync(profileKey);

      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      } else {
        // Create default profile
        const defaultProfile: UserProfile = {
          userId: storedUserId,
          name: "User",
          preferences: {
            ttsEnabled: true,
            language: "en-US",
          },
          conversationHistory: [],
        };
        await SecureStore.setItemAsync(
          profileKey,
          JSON.stringify(defaultProfile)
        );
        setProfile(defaultProfile);
      }
    };

    initializeUser();
  }, []);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!userId || !profile) return;

    const updatedProfile = { ...profile, ...updates };
    setProfile(updatedProfile);

    await SecureStore.setItemAsync(
      `${PROFILE_KEY_PREFIX}${userId}`,
      JSON.stringify(updatedProfile)
    );
  };

  return { userId, profile, updateProfile };
};
