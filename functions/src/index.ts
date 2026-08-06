import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

export const autoAssignLeads = onSchedule("every 1 hours", async (event) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // 1. Fetch all Unassigned Students
    // Using "Users" to match project collection naming
    const studentsSnap = await db.collection("Users")
      .where("role", "==", "Student")
      .where("counselorId", "==", null)
      .get();

    // Filter for students created more than 1 hour ago
    const unassignedStudents = studentsSnap.docs.filter((doc) => {
      const data = doc.data();
      if (!data.createdAt) return false;
      const createdAt = data.createdAt.toDate();
      return createdAt < oneHourAgo;
    });

    if (unassignedStudents.length === 0) {
      console.log("No stale unassigned leads found.");
      return;
    }

    // 2. Fetch all Counselors
    const counselorsSnap = await db.collection("Users")
      .where("role", "==", "Counselor")
      .get();

    if (counselorsSnap.empty) {
      console.error("No counselors available for assignment.");
      return;
    }

    // 3. Calculate current workload for each counselor
    // Note: This query might require a composite index (role, counselorId)
    const assignedSnap = await db.collection("Users")
      .where("role", "==", "Student")
      .where("counselorId", ">", "")
      .get();

    const workloadMap = new Map<string, number>();
    assignedSnap.docs.forEach((doc) => {
      const cId = doc.data().counselorId;
      workloadMap.set(cId, (workloadMap.get(cId) || 0) + 1);
    });

    const counselors = counselorsSnap.docs.map((doc) => ({
      id: doc.id,
      count: workloadMap.get(doc.id) || 0,
    }));

    // 4. Load Balance & Batch Update
    const batch = db.batch();

    for (const studentDoc of unassignedStudents) {
      // Sort so the counselor with the lowest count is at index 0
      counselors.sort((a, b) => a.count - b.count);
      const chosenCounselor = counselors[0];

      // Add update to batch
      batch.update(studentDoc.ref, {
        counselorId: chosenCounselor.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Increment local count to balance the next iteration
      chosenCounselor.count += 1;
    }

    await batch.commit();
    console.log(`Successfully auto-assigned ${unassignedStudents.length} leads.`);

  } catch (error) {
    console.error("Error auto-assigning leads:", error);
  }
});
