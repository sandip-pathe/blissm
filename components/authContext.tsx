import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { FIREBASE_AUTH, FIREBASE_APP } from "@/FirebaseConfig";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

type UserProfile = {
  uid: string;
  email: string;
  fullName?: string;
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

  // Function to fetch user profile from Firestore
  const fetchUserProfile = async (userId: string) => {
    try {
      const userDocRef = doc(db, "users", userId);
      const userProfileDoc = await getDoc(userDocRef);

      if (userProfileDoc.exists()) {
        const userData = userProfileDoc.data() as UserProfile;
        setCurrentUser({
          ...userData,
          uid: userId,
        });
      } else {
        console.warn(
          "User authenticated but Firestore profile missing. Waiting..."
        );
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
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, async (user) => {
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

  const value = {
    currentUser,
    loading,
    error,
    refreshUserProfile, // Provide the function in context
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
