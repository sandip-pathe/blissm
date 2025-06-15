import * as SecureStore from "expo-secure-store";
import { UserProfile } from "../types/agents";

const PROFILE_KEY = "user_profile";

export const getProfile = async (userId: string): Promise<UserProfile> => {
  const profileJson = await SecureStore.getItemAsync(
    `${PROFILE_KEY}_${userId}`
  );
  if (profileJson) {
    return JSON.parse(profileJson);
  }

  // Default profile
  return {
    userId,
    name: "User",
    preferences: {
      ttsEnabled: true,
      language: "en-US",
    },
    conversationHistory: [],
  };
};

export const updateProfile = async (
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> => {
  const currentProfile = await getProfile(userId);
  const updatedProfile = { ...currentProfile, ...updates };

  await SecureStore.setItemAsync(
    `${PROFILE_KEY}_${userId}`,
    JSON.stringify(updatedProfile)
  );

  return updatedProfile;
};
