"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { evaluateDomainRole } from "./domain-roles";
import { AppRole, UserProfile } from "@/types";

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  role: AppRole | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithNameAndEmail: (displayName: string, email: string) => Promise<void>;
  signInAdminWithPassword: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  role: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithNameAndEmail: async () => {},
  signInAdminWithPassword: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUserToFirestore = async (
    currentUser: FirebaseUser,
    customName?: string,
    customEmail?: string
  ) => {
    const effectiveEmail = customEmail || currentUser.email || undefined;
    const computedRole = evaluateDomainRole(effectiveEmail, currentUser.isAnonymous && !customEmail);
    setRole(computedRole);

    const profileData: UserProfile = {
      uid: currentUser.uid,
      email: effectiveEmail || "guest@basechanwiser.local",
      displayName: customName || currentUser.displayName || "Staff Member",
      role: computedRole,
      intake: "Fall 2026",
      office: "London HQ",
      updatedAt: serverTimestamp(),
    };

    setUserProfile(profileData);

    try {
      const userRef = doc(db, "Users", currentUser.uid);
      await setDoc(userRef, profileData, { merge: true });
    } catch (error) {
      console.warn("Firestore sync offline fallback:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check if there is already a stored profile in Firestore
        try {
          const userRef = doc(db, "Users", currentUser.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setUserProfile(data);
            setRole(data.role || evaluateDomainRole(data.email, currentUser.isAnonymous));
          } else {
            await syncUserToFirestore(currentUser);
          }
        } catch (e) {
          await syncUserToFirestore(currentUser);
        }
      } else {
        setRole(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await syncUserToFirestore(result.user);
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      setLoading(false);
      throw error;
    }
  };

  // Passwordless Name & Email Login (for Staff & Guest Logins)
  const signInWithNameAndEmail = async (displayName: string, email: string) => {
    setLoading(true);
    try {
      const result = await signInAnonymously(auth);
      if (result.user) {
        await updateProfile(result.user, { displayName });
        await syncUserToFirestore(result.user, displayName, email);
      }
    } catch (error) {
      console.error("Name & Email Sign-In Error:", error);
      setLoading(false);
      throw error;
    }
  };

  // Admin Password Login (for credentials created directly in backend)
  const signInAdminWithPassword = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      if (result.user) {
        await syncUserToFirestore(result.user, result.user.displayName || "Admin User", email);
      }
    } catch (error) {
      console.error("Admin Sign-In Error:", error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    await firebaseSignOut(auth);
    setUser(null);
    setRole(null);
    setUserProfile(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        role,
        loading,
        signInWithGoogle,
        signInWithNameAndEmail,
        signInAdminWithPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
