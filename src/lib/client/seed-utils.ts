import { db } from "@/lib/firebase/config";
import { collection, doc, setDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { CORE_UKVI_MODULES, CORE_UKVI_MOCK_SET } from "@/lib/seed/academy-seed";

/**
 * Client-Side System Recovery Engine
 * Recreates core UKVI content directly from the client.
 */
export async function runSystemRecovery() {
  try {
    const batch = writeBatch(db);

    // 1. Restore Core Modules (Learning Tests)
    for (const mod of CORE_UKVI_MODULES) {
      if (!mod.id) continue;
      const modRef = doc(db, "test_question_sets", mod.id);
      batch.set(modRef, {
        ...mod,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      }, { merge: true });
    }

    // 2. Restore Core Mock Interview Set
    const mockRef = doc(db, "mock_interview_sets", CORE_UKVI_MOCK_SET.id);
    batch.set(mockRef, {
      ...CORE_UKVI_MOCK_SET,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });

    await batch.commit();
    return { success: true, message: "System recovery complete! 5 Core Modules and the Standard Mock Set have been restored." };
  } catch (error: any) {
    console.error("Recovery Error:", error);
    return { success: false, message: error.message || "Failed to restore system content." };
  }
}
