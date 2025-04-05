import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { FIREBASE_AUTH, FIREBASE_APP } from "../constants/firebaseConf";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { firestoreEmitter } from "./NetworkContext";

type UserProfile = {
  uid: string;
  email: string;
  name?: string;
  contact?: string;
};

// Define context value types
interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshUserProfile: () => Promise<void>; // NEW FUNCTION
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Use Firestore instance
const db = getFirestore(FIREBASE_APP);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async (userId: string) => {
    try {
      const userDocRef = doc(db, "users", userId);
      const userProfileDoc = await getDoc(userDocRef);

      if (userProfileDoc.exists()) {
        const userData = userProfileDoc.data() as UserProfile;
        setCurrentUser({ ...userData, uid: userId });
        console.log("User profile fetched:", userData); // Debug log
      } else {
        console.warn("User authenticated but Firestore profile missing.");
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError("Failed to fetch user profile");
    }
  };

  // Function to manually refresh user profile
  const refreshUserProfile = useCallback(async () => {
    if (FIREBASE_AUTH.currentUser) {
      await fetchUserProfile(FIREBASE_AUTH.currentUser.uid);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    const checkInitialUser = async () => {
      setLoading(true);
      if (FIREBASE_AUTH.currentUser) {
        console.log("Initial Firebase user:", FIREBASE_AUTH.currentUser);
        await fetchUserProfile(FIREBASE_AUTH.currentUser.uid);
      }
      setLoading(false);
    };

    checkInitialUser();
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, async (user) => {
      console.log("Auth state changed:", user);
      setLoading(true);
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const refreshListener = () => {
      refreshUserProfile();
    };

    firestoreEmitter.on("refreshFirestore", refreshListener);
    return () => {
      firestoreEmitter.off("refreshFirestore", refreshListener);
    };
  }, [refreshUserProfile]);

  const value = {
    currentUser,
    loading,
    error,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useCustomAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
