import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { signOut, deleteUser } from "firebase/auth";

/**
 * Updates the user's profile data in Firestore and refreshes the profile.
 * @throws Error if fullName is empty.
 */
export const updateUserProfile = async (
  fullName: string,
  contact: string,
  FIRESTORE_DB: any,
  auth: any,
  refreshUserProfile: () => Promise<void>
) => {
  if (!fullName.trim()) {
    throw new Error("Name cannot be empty.");
  }
  const userRef = doc(FIRESTORE_DB, "users", auth.currentUser.uid);
  await updateDoc(userRef, { fullName, contact });
  await refreshUserProfile();
};

/**
 * Signs out the user and navigates to the login screen.
 */
export const logoutUser = async (auth: any, router: any) => {
  await signOut(auth);
  router.replace("/(modals)/login");
};

/**
 * Deletes the user's account and all associated data.
 */
export const deleteUserAccount = async (
  auth: any,
  FIRESTORE_DB: any,
  clearAllData: (db: any) => Promise<void>,
  db: any,
  router: any
) => {
  const user = auth.currentUser;
  if (user) {
    const userRef = doc(FIRESTORE_DB, "users", user.uid);
    await deleteDoc(userRef);
    await deleteUser(user);
    await clearAllData(db);
    router.replace("/(modals)/login");
  }
};

/**
 * Clears the local SQL cache.
 */
export const clearCacheData = async (
  clearAllData: (db: any) => Promise<void>,
  db: any
) => {
  await clearAllData(db);
};

export default {
  updateUserProfile,
  logoutUser,
  deleteUserAccount,
  clearCacheData,
};
