import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { verifyRequestRole } from "@/lib/server/verify-role";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(req: Request) {
  const authResult = await verifyRequestRole(req, ["Super Admin", "Admin"]);
  if (authResult.error) return authResult.error;

  try {
    const packsRef = db.collection('question_packs');

    const modulesToSeed = [
      {
        id: "pack_m1",
        title: "Module 1: Fundamentals of UKVI Credibility Interviews",
        description: "Purpose of interviews, Home Office guidelines, and genuine student status.",
        order: 1,
        category: "General Compliance",
        isDefault: true,
        passScore: 80,
        questions: [
          {
            id: "m1_q1",
            questionText: "What is the primary objective of a UKVI Credibility Interview?",
            options: [
              { id: "m1_q1_o1", text: "To assess if the student qualifies for permanent residency", isCorrect: false },
              { id: "m1_q1_o2", text: "To confirm the applicant is a genuine student with authentic intentions to study", isCorrect: true },
              { id: "m1_q1_o3", text: "To test the student's ability to work full-time in the UK", isCorrect: false },
              { id: "m1_q1_o4", text: "To evaluate the student's fitness levels for entry", isCorrect: false }
            ],
            explanation: "UKVI conducts credibility interviews to verify that the primary purpose is academic study, not illegal work."
          }
        ],
      },
      {
        id: "pack_m2",
        title: "Module 2: CAS & Financial Compliance",
        description: "Master the 28-day rule, maintenance funds, and acceptable sponsors.",
        order: 2,
        category: "Financial",
        isDefault: true,
        passScore: 80,
        questions: [
          {
            id: "m2_q1",
            questionText: "Under UKVI rules, what is the continuous holding period required for liquid funds?",
            options: [
              { id: "m2_q1_o1", text: "14 consecutive days", isCorrect: false },
              { id: "m2_q1_o2", text: "28 consecutive days", isCorrect: true },
              { id: "m2_q1_o3", text: "90 consecutive days", isCorrect: false }
            ],
            explanation: "Total required money must remain in the bank for 28 consecutive days without falling below the minimum."
          }
        ],
      }
    ];

    const batch = db.batch();
    for (const pack of modulesToSeed) {
      const docRef = packsRef.doc(pack.id);
      batch.set(docRef, {
        ...pack,
        createdBy: authResult.caller.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    await batch.commit();

    return NextResponse.json({ message: "Successfully seeded question packs!" }, { status: 200 });
  } catch (error: any) {
    console.error("Seeding error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
