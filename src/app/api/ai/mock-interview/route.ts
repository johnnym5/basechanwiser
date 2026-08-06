// src/app/api/ai/mock-interview/route.ts
import { NextResponse } from 'next/server';
import { sanitizeInput } from '@/lib/server/sanitizer';
import { checkRateLimit } from '@/lib/server/rateLimiter';
import { db, Timestamp } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

const MOCK_QUESTIONS = [
  "Please introduce yourself and state your full name and date of birth.",
  "Why have you chosen to study in the UK rather than your home country?",
  "Why did you choose this specific university and course?",
  "How will you fund your studies and living expenses in the UK?",
  "What are your career plans immediately after graduating?"
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      uid,
      action,
      questionText,
      studentResponse,
      finalScore,
      transcript,
    } = body;

    if (!uid) {
      return NextResponse.json({ error: 'Missing required field: uid' }, { status: 400 });
    }

    const rateCheck = await checkRateLimit(uid, 'Student');
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: rateCheck.message }, { status: 429 });
    }

    if (action === 'start') {
      return NextResponse.json({
        success: true,
        nextQuestion: MOCK_QUESTIONS[0]
      });
    }

    if (action === 'step') {
      if (!questionText || !studentResponse) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
      }

      // Find current index
      const currentIndex = MOCK_QUESTIONS.indexOf(questionText);
      const nextIndex = currentIndex + 1;
      const isLast = nextIndex >= MOCK_QUESTIONS.length;

      return NextResponse.json({
        success: true,
        feedback: "Thank you for your answer. In a real UKVI interview, the officer would be looking for specific details and evidence of your genuine intent to study. Your counselor will review your full recording for more detailed feedback.",
        score: 80,
        accuracy: 85,
        grammar: 90,
        consistency: 90,
        redFlags: [],
        nextQuestion: isLast ? null : MOCK_QUESTIONS[nextIndex]
      });
    }

    if (action === 'complete') {
      const sessionRef = await db.collection('ai_mock_sessions').add({
        userId: uid,
        finalScore: finalScore || 0,
        transcript: transcript || [],
        createdAt: Timestamp.now(),
        mode: 'static_baseline'
      });

      return NextResponse.json({ success: true, sessionId: sessionRef.id });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Mock Interview API Error:', error);
    return NextResponse.json({ error: "System taking a break. Please try again later." }, { status: 500 });
  }
}
