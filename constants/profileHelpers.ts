import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { signOut, deleteUser } from "firebase/auth";

export const updateUserProfile = async (
  name: string,
  contact: string,
  FIRESTORE_DB: any,
  auth: any,
  refreshUserProfile: () => Promise<void>
) => {
  const userRef = doc(FIRESTORE_DB, "users", auth.currentUser.uid);
  await updateDoc(userRef, { name, contact });
  await refreshUserProfile();
};

export const logoutUser = async (auth: any, router: any) => {
  await signOut(auth);
  router.replace("/");
};

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
