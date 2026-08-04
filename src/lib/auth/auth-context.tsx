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
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { evaluateDomainRole } from "./domain-roles";
import { AppRole, UserProfile } from "@/types";

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  userId: string | null;
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
  userId: null,
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
    // If anonymous, try to recover email/name from localStorage if not provided
    let recoveredEmail = customEmail;
    let recoveredName = customName;

    if (currentUser.isAnonymous && !recoveredEmail) {
      recoveredEmail = localStorage.getItem("bw_guest_email") || undefined;
      recoveredName = localStorage.getItem("bw_guest_name") || undefined;
    }

    const effectiveEmail = recoveredEmail || currentUser.email || undefined;
    const computedRole = evaluateDomainRole(
      effectiveEmail,
      currentUser.isAnonymous
    );
    setRole(computedRole);

    // ── 1. Check for Existing Account by Email (Enforce Uniqueness) ────
    if (effectiveEmail) {
      try {
        const usersRef = collection(db, "Users");
        const q = query(usersRef, where("email", "==", effectiveEmail));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const existingDoc = querySnapshot.docs[0];
          const { uid, ...existingData } = existingDoc.data() as UserProfile;

          // If the UID is different, it's an account linking case
          if (existingDoc.id !== currentUser.uid) {
            console.log("[Auth] Existing account found with different UID. Linking to existing profile.");
          }

          setUserProfile({ uid: existingDoc.id, ...existingData, role: computedRole });
          setRole(computedRole);

          await updateDoc(doc(db, "Users", existingDoc.id), {
            lastLoginAt: serverTimestamp(),
            role: computedRole // Enforce role on every login
          });
          return;
        }
      } catch (e) {
        console.warn("[Auth] Email uniqueness check failed:", e);
      }
    }

    const userRef = doc(db, "Users", currentUser.uid);

    // ── 2. Fallback: Try to load by UID ──────────────────────────
    let existingProfile: UserProfile | null = null;
    try {
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        existingProfile = { uid: snap.id, ...snap.data() } as UserProfile;
      }
    } catch (e) {
      console.warn("[Auth] Could not read user profile by UID:", e);
    }

    // ── 3. Existing user by UID ──────────────────────────────────
    if (existingProfile) {
      setUserProfile({ ...existingProfile, role: computedRole });
      setRole(computedRole);

      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
        role: computedRole // Enforce role
      });
      return;
    }

    // ── 4. New user — create Firestore document ──────────────────
    const profileData = {
      uid: currentUser.uid,
      displayName: recoveredName || currentUser.displayName || "New Student",
      email: effectiveEmail || "guest@basechanwiser.local",
      photoURL: currentUser.photoURL || "",
      role: computedRole,
      officeLocation: "Unassigned",
      assignedPackIds: [],
      completedPackIds: [],
      currentModuleLevel: 1,
      moduleScores: {},
      readinessStatus: "Gray",
      learningProgress: 0,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };

    setUserProfile(profileData as unknown as UserProfile);
    await setDoc(userRef, profileData, { merge: true });
    console.log("[Auth] New user registered:", currentUser.uid);
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
      localStorage.setItem("bw_guest_email", email);
      localStorage.setItem("bw_guest_name", displayName);
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
    localStorage.removeItem("bw_guest_email");
    localStorage.removeItem("bw_guest_name");
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
        userId: userProfile?.uid || user?.uid || null,
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
