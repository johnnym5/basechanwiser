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

function resolveUserRole(domainRole: AppRole, storedRole?: AppRole | null): AppRole {
  if (storedRole === "Head of Compliance") return "Head of Compliance";
  if (domainRole === "Super Admin") return "Super Admin";
  return domainRole;
}

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
  simulatedRole: AppRole | null;
  setSimulatedRole: (role: AppRole | null) => void;
  effectiveRole: AppRole | null;
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
  simulatedRole: null,
  setSimulatedRole: () => {},
  effectiveRole: null,
});

const generateStudentId = () => {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `BW-${randomNum}`;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulatedRole, setSimulatedRole] = useState<AppRole | null>(null);

  const effectiveRole = (role === "Super Admin" || role === "Admin") && simulatedRole
    ? simulatedRole
    : role;

  const syncUserToFirestore = async (
    currentUser: FirebaseUser,
    customName?: string,
    customEmail?: string
  ) => {
    try {
      // If anonymous, try to recover email/name from localStorage if not provided
      let recoveredEmail = customEmail;
      let recoveredName = customName;

      if (currentUser.isAnonymous && !recoveredEmail) {
        recoveredEmail = localStorage.getItem("bw_guest_email") || undefined;
        recoveredName = localStorage.getItem("bw_guest_name") || undefined;
      }

      const effectiveEmail = recoveredEmail || currentUser.email || undefined;
      const domainRole = evaluateDomainRole(effectiveEmail, currentUser.isAnonymous);

      // ── 1. Check for Existing Account by Email (resilient check) ────
      if (effectiveEmail) {
        try {
          const usersRef = collection(db, "Users");
          const q = query(usersRef, where("email", "==", effectiveEmail));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const existingDoc = querySnapshot.docs[0];
            const { uid, ...existingData } = existingDoc.data() as UserProfile;
            const computedRole = resolveUserRole(domainRole, existingData.role);

            setUserProfile({ uid: existingDoc.id, ...existingData, role: computedRole });
            setRole(computedRole);

            await updateDoc(doc(db, "Users", existingDoc.id), {
              lastLoginAt: serverTimestamp(),
              role: computedRole,
            });
            return;
          }
        } catch (e) {
          console.warn("[Auth] Email uniqueness check failed or timed out:", e);
        }
      }

      // ── 2. Load by UID (Primary authoritative check) ──────────────────────────
      const userRef = doc(db, "Users", currentUser.uid);
      let existingProfile: UserProfile | null = null;
      try {
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          existingProfile = { uid: snap.id, ...snap.data() } as UserProfile;
        }
      } catch (e) {
        console.warn("[Auth] UID profile fetch failed (possible permission issue):", e);
      }

      // ── 3. Handle Existing Profile ──────────────────────────────────
      if (existingProfile) {
        const computedRole = resolveUserRole(domainRole, existingProfile.role);
        const updates: any = {
          lastLoginAt: serverTimestamp(),
          role: computedRole,
        };

        if (!existingProfile.studentId) {
          updates.studentId = generateStudentId();
          existingProfile.studentId = updates.studentId;
        }

        setUserProfile({ ...existingProfile, role: computedRole });
        setRole(computedRole);

        try {
          await updateDoc(userRef, updates);
        } catch (e) {
          console.warn("[Auth] Failed to update login timestamp:", e);
        }
        return;
      }

      // ── 4. New user Registration ──────────────────────────────────
      const computedRole = domainRole;
      const profileData = {
        uid: currentUser.uid,
        studentId: generateStudentId(),
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
      setRole(computedRole);

      try {
        await setDoc(userRef, profileData, { merge: true });
        console.log("[Auth] New user registered:", currentUser.uid);
      } catch (e) {
        console.error("[Auth] Failed to create new user doc:", e);
      }
    } catch (err) {
      console.error("[Auth Context] syncUserToFirestore fatal error:", err);
      // Fallback: set a minimal profile if Firestore completely fails
      setRole(currentUser.isAnonymous ? "Student" : "Student");
    }
  };

  useEffect(() => {
    // ── Safety Fallback Timeout (5 seconds) ─────────────────────────
    const fallbackTimer = setTimeout(() => {
      setLoading((prevLoading) => {
        if (prevLoading) {
          console.warn("[AuthContext] Auth check timed out. Forcing UI render.");
          return false;
        }
        return prevLoading;
      });
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setUser(currentUser);
        if (currentUser) {
          // Sync profile but don't let it block indefinitely
          await syncUserToFirestore(currentUser);
        } else {
          setRole(null);
          setUserProfile(null);
        }
      } catch (err) {
        console.error("[AuthContext Error]: Auth state transition failed:", err);
        setRole(null);
        setUserProfile(null);
      } finally {
        clearTimeout(fallbackTimer);
        setLoading(false); // GUARANTEED to run
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
        const googleRole = evaluateDomainRole(result.user.email, false);
        setRole(googleRole);
        await syncUserToFirestore(result.user);
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      throw error;
    } finally {
      setLoading(false);
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
      throw error;
    } finally {
      setLoading(false);
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
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem("bw_guest_email");
      localStorage.removeItem("bw_guest_name");
      await firebaseSignOut(auth);
      setUser(null);
      setRole(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
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
        simulatedRole,
        setSimulatedRole,
        effectiveRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
