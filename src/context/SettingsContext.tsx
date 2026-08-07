"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { GlobalSettings, UserPreferences } from "@/types/settings";
import { useAuth } from "@/lib/auth/auth-context";

interface SettingsContextType {
  globalSettings: GlobalSettings | null;
  userPreferences: UserPreferences | null;
  updateGlobalSettings: (updates: Partial<GlobalSettings>) => Promise<void>;
  updateUserPreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
  globalSettings: null,
  userPreferences: null,
  updateGlobalSettings: async () => {},
  updateUserPreferences: async () => {},
  loading: true,
});

const DEFAULT_GLOBAL: GlobalSettings = {
  primaryColor: "#1a73e8",
  dataRetentionDays: 90,
  globalRubric: [
    { id: "fluency", label: "English Fluency", maxScore: 10 },
    { id: "finance", label: "Financial Awareness", maxScore: 10 },
    { id: "intent", label: "Genuine Intent", maxScore: 10 },
  ],
  maintenanceMode: false,
  defaultPassMark: 80,
  offices: ["Lagos", "Abuja", "Benin"],
};

const DEFAULT_USER_PREFS: UserPreferences = {
  timezone: "Europe/London",
  emailNotifications: true,
  inAppNotifications: true,
  lowBandwidthMode: false,
  themePreference: "system",
};

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { userId } = useAuth();
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to global settings
    const unsubGlobal = onSnapshot(doc(db, "settings", "global"), (snap) => {
      if (snap.exists()) {
        setGlobalSettings(snap.data() as GlobalSettings);
      } else {
        // Init if not exists
        setDoc(doc(db, "settings", "global"), DEFAULT_GLOBAL);
      }
    });

    return () => unsubGlobal();
  }, []);

  useEffect(() => {
    if (!userId) {
      setUserPreferences(null);
      return;
    }

    const unsubUser = onSnapshot(doc(db, "Users", userId, "settings", "preferences"), (snap) => {
      if (snap.exists()) {
        setUserPreferences(snap.data() as UserPreferences);
      } else {
        setDoc(doc(db, "Users", userId, "settings", "preferences"), DEFAULT_USER_PREFS);
      }
      setLoading(false);
    });

    return () => unsubUser();
  }, [userId]);

  const updateGlobalSettings = async (updates: Partial<GlobalSettings>) => {
    await updateDoc(doc(db, "settings", "global"), updates);
  };

  const updateUserPreferences = async (updates: Partial<UserPreferences>) => {
    if (!userId) return;
    await updateDoc(doc(db, "Users", userId, "settings", "preferences"), updates);
  };

  return (
    <SettingsContext.Provider value={{ globalSettings, userPreferences, updateGlobalSettings, updateUserPreferences, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
