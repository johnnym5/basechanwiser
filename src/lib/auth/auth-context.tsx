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
    const computedRole = evaluateDomainRole(
      effectiveEmail,
      currentUser.isAnonymous && !customEmail
    );
    setRole(computedRole);

    const userRef = doc(db, "Users", currentUser.uid);

    // ── 1. Try to load existing profile ──────────────────────────
    let existingProfile: UserProfile | null = null;
    try {
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        existingProfile = { uid: snap.id, ...snap.data() } as UserProfile;
      }
    } catch (e) {
      // getDoc can fail due to network/permissions — we still want to
      // attempt creation below so we do NOT return here.
      console.warn("[Auth] Could not read user profile, will attempt upsert:", e);
    }

    // ── 2. Existing user — update state and refresh login timestamp ─
    if (existingProfile) {
      setUserProfile(existingProfile);
      setRole(existingProfile.role || computedRole);

      try {
        await setDoc(
          userRef,
          { lastLoginAt: serverTimestamp() },
          { merge: true }
        );
      } catch (e) {
        console.warn("[Auth] Could not update lastLoginAt:", e);
      }
      console.log("[Auth] Existing user loaded:", currentUser.uid, existingProfile.role);
      return;
    }

    // ── 3. New user — create Firestore document ──────────────────
    const profileData = {
      uid: currentUser.uid,
      displayName: customName || currentUser.displayName || "New Student",
      email: effectiveEmail || "guest@basechanwiser.local",
      photoURL: currentUser.photoURL || "",
      role: computedRole,
      officeLocation: "Unassigned",
      assignedPackIds: [],
      completedPackIds: [],
      readinessStatus: "Red",
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };

    // Set local state immediately so the UI updates right away
    setUserProfile(profileData as unknown as UserProfile);

    try {
      await setDoc(userRef, profileData, { merge: true });
      console.log("[Auth] New user registered in Firestore:", currentUser.uid, computedRole);
    } catch (error) {
      console.error("[Auth] FAILED to write user document to Firestore:", error);
      // Surface a more useful error in dev — the most common cause is
      // Firestore security rules blocking the write.
    }
  };

  useEffect(() => {
    // ── Safety Fallback Timer ────────────────────────────────────
    // Prevents infinite loading splash screen if Firebase Auth hangs
    const fallbackTimer = setTimeout(() => {
      setLoading((prevLoading) => {
        if (prevLoading) {
          console.warn("[AuthContext] Auth check timed out after 5s. Forcing loading = false.");
          return false;
        }
        return prevLoading;
      });
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setUser(currentUser);
        if (currentUser) {
          await syncUserToFirestore(currentUser);
        } else {
          setRole(null);
          setUserProfile(null);
        }
      } catch (err) {
        console.error("[AuthContext Error]: Failed during auth state sync:", err);
        setRole(null);
        setUserProfile(null);
      } finally {
        clearTimeout(fallbackTimer);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        // Determine role based on the Google account email (including super‑admin override)
        const googleRole = evaluateDomainRole(result.user.email, false);
        setRole(googleRole);
        await syncUserToFirestore(result.user);
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      setLoading(false);
      throw error;
    }
  };

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
