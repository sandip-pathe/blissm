// AuthContext.tsx

import React, { createContext, useState, useEffect, useContext } from "react";
import { FIREBASE_AUTH, FIREBASE_APP } from "@/FirebaseConfig";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// Define the user profile type
type UserProfile = {
  uid: string;
  email: string;
  role: string;
  fullName?: string;
  contact?: string;
};

// Define context value types
interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  error: string | null;
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Use Firestore instance
const db = getFirestore(FIREBASE_APP);

// Create a provider to wrap around the app
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, async (user) => {
      setLoading(true);
      if (user) {
        try {
          const userDocRef = doc(db, "admins", user.uid);
          const userProfileDoc = await getDoc(userDocRef);
          if (userProfileDoc.exists()) {
            const userData = userProfileDoc.data() as UserProfile;
            setCurrentUser({
              ...userData,
              uid: user.uid,
              email: user.email ?? "",
            });
          } else {
            console.error("No such user profile found");
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
          setError("Failed to fetch user profile");
        }
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useCustomAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
