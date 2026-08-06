// src/app/api/ai/assistant/route.ts
import { NextResponse } from 'next/server';
import { sanitizeInput } from '@/lib/server/sanitizer';
import { adminDb, FieldValue } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

// Configuration
const COOLDOWN_SECONDS = 5; // Reduced for non-AI mode
const DAILY_LIMIT = 100;

const SUPPORTIVE_MESSAGES = [
  "I'm here to support your UKVI preparation. Have you reviewed the 28-day rule lately?",
  "That's a great question. Remember to be specific about your chosen university in your answers.",
  "Stay focused on your goals! Your counselor will review your dossier soon.",
  "Excellent progress so far. Consistency is key to a successful CAS interview.",
  "I recommend checking the Resource Vault for the latest UKVI compliance checklists.",
  "Your career plans back home are a vital part of the 'Genuine Student' test. Keep refining them!",
  "Friendly reminder: ensure your bank statements meet the 31-day closing date requirement.",
  "You're doing great! Keep practicing your verbal delivery to sound natural and confident."
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, context } = body;

    if (!context?.userUid || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const userId = context.userUid;
    const userRole = context.userRole || 'Student';

    // Sanitize incoming message
    const sanitizedResult = sanitizeInput(message, 300);
    const cleanMessage = sanitizedResult.sanitized;

    // 1. RATE LIMITING & USER DATA FETCH (Skip for Admins/Counselors)
    const userRef = adminDb.collection('Users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const now = Date.now();
    const todayStr = new Date().toISOString().split('T')[0];

    if (userRole === 'Student') {
      // Check Cooldown
      if (userData?.aiChatStats?.lastMessageAt) {
        const lastMsgTime = userData.aiChatStats.lastMessageAt.toDate().getTime();
        const timeSinceLastMsg = now - lastMsgTime;
        if (timeSinceLastMsg < (COOLDOWN_SECONDS * 1000)) {
          const waitTime = Math.ceil((COOLDOWN_SECONDS * 1000 - timeSinceLastMsg) / 1000);
          return NextResponse.json({
            error: `Please wait ${waitTime}s...`,
            cooldown: waitTime
          }, { status: 429 });
        }
      }
    }

    // 2. GENERATE STATIC RESPONSE
    const randomMsg = SUPPORTIVE_MESSAGES[Math.floor(Math.random() * SUPPORTIVE_MESSAGES.length)];
    const staticResponse = `[Offline Mode] ${randomMsg}\n\n(Note: AI services are currently disabled for baseline stability. Please contact your counselor for direct support.)`;

    // 3. UPDATE STATS (Only for Students)
    if (userRole === 'Student') {
      const currentCount = userData?.aiChatStats?.date === todayStr ? userData.aiChatStats.count : 0;
      await userRef.update({
        aiChatStats: {
          lastMessageAt: FieldValue.serverTimestamp(),
          date: todayStr,
          count: currentCount + 1
        }
      });
    }

    return NextResponse.json({
      success: true,
      text: staticResponse,
      warnings: sanitizedResult.warnings
    }, { status: 200 });

  } catch (error: any) {
    console.error("Assistant Route Error:", error);
    return NextResponse.json({ error: "Service currently unavailable." }, { status: 500 });
  }
}
