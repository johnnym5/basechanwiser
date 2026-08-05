// src/app/api/ai/mock-interview/route.ts
import { NextResponse } from 'next/server';
import { sanitizeInput } from '@/lib/server/sanitizer';
import { checkRateLimit } from '@/lib/server/rateLimiter';
import { db, Timestamp } from '@/lib/firebaseAdmin';

const allowedCategories = ['Financial', 'Academic', 'Career', 'Full UKVI Mock'];

const modelsToTry = ['gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-1.5-flash'];

const buildStartPrompt = (category: string) => {
  return `You are a strict but fair UKVI Entry Clearance Officer conducting a credibility interview with an international student.
The student has selected the "${category}" category.

Instructions for your response:
1. If this is the start of the chat, ask the first relevant question.
2. Keep your tone professional and direct.
3. Return your response in STRICT JSON format:
{
  "nextQuestion": "The first question you want to ask the student."
}`;
};

const buildStepPrompt = (category: string, questionText: string, studentResponse: string) => {
  return `You are a strict but fair UKVI Entry Clearance Officer conducting a credibility interview.
The student has selected the "${category}" category.

Instructions for your response:
1. Evaluate the student's answer based on:
   - Accuracy (Did it answer the prompt?)
   - Red Flags (Did they show immigration intent instead of study intent?)
   - Grammar and clarity
   - Consistency with study purpose and UKVI credibility.
2. Return your response in STRICT JSON format:
{
  "feedback": "Your evaluation of their previous answer. Be direct.",
  "score": 0,
  "accuracy": 0,
  "grammar": 0,
  "consistency": 0,
  "redFlags": ["Any red flag summaries, or an empty array if none."],
  "nextQuestion": "The next question you want to ask them."
}

QUESTION: "${questionText}"
STUDENT RESPONSE: "${studentResponse}"`;
};

const callGemini = async (prompt: string) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is missing on backend server.');
  }

  let lastErr = '';
  for (const modelName of modelsToTry) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    try {
      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
        }),
      });
      if (res.ok) {
        return res;
      }
      lastErr = await res.text();
    } catch (err: any) {
      lastErr = err.message;
    }
  }
  throw new Error(`Gemini AI service error: ${lastErr}`);
};

const parseJsonResponse = (rawText: string) => {
  const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleanText);
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      uid,
      action,
      category,
      questionText,
      studentResponse,
      finalScore,
      transcript,
      redFlagsTriggered,
    } = body;

    if (!uid) {
      return NextResponse.json({ error: 'Missing required field: uid' }, { status: 400 });
    }

    const rateCheck = await checkRateLimit(uid, 'Student');
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: rateCheck.message }, { status: rateCheck.statusCode || 429 });
    }

    const interviewCategory = allowedCategories.includes(category) ? category : 'Full UKVI Mock';

    if (action === 'start') {
      if (!category) {
        return NextResponse.json({ error: 'Missing required field: category' }, { status: 400 });
      }

      const prompt = buildStartPrompt(interviewCategory);
      const response = await callGemini(prompt);
      const geminiRes = await response.json();
      const rawText = geminiRes?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

      let parsed: { nextQuestion: string } = { nextQuestion: 'Please describe your intended course of study in the UK.' };
      try {
        parsed = parseJsonResponse(rawText);
      } catch {
        parsed.nextQuestion = 'Please describe your intended course of study in the UK.';
      }

      return NextResponse.json({ success: true, nextQuestion: parsed.nextQuestion });
    }

    if (action === 'step') {
      if (!questionText || !studentResponse) {
        return NextResponse.json({ error: 'Missing required fields: questionText or studentResponse' }, { status: 400 });
      }

      const sanitizedQuestion = sanitizeInput(questionText, 500);
      const sanitizedAnswer = sanitizeInput(studentResponse, 1500);
      const sanitizationWarnings = [
        ...sanitizedQuestion.warnings,
        ...sanitizedAnswer.warnings,
      ];

      const prompt = buildStepPrompt(interviewCategory, sanitizedQuestion.sanitized, sanitizedAnswer.sanitized);
      const response = await callGemini(prompt);
      const geminiRes = await response.json();
      const rawText = geminiRes?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

      let parsed: any = {
        feedback: 'Unable to generate feedback at this time.',
        score: 0,
        accuracy: 0,
        grammar: 0,
        consistency: 0,
        redFlags: [],
        nextQuestion: 'Please continue with your next response.',
      };
      try {
        parsed = parseJsonResponse(rawText);
      } catch {
        parsed.feedback = rawText;
        parsed.nextQuestion = 'Please continue with your next response.';
      }

      return NextResponse.json({
        success: true,
        feedback: parsed.feedback,
        score: Number(parsed.score ?? 0),
        accuracy: Number(parsed.accuracy ?? parsed.score ?? 0),
        grammar: Number(parsed.grammar ?? 0),
        consistency: Number(parsed.consistency ?? 0),
        redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
        nextQuestion: parsed.nextQuestion,
        warnings: sanitizationWarnings,
      });
    }

    if (action === 'complete') {
      if (typeof finalScore !== 'number' || !Array.isArray(transcript)) {
        return NextResponse.json({ error: 'Missing required fields: finalScore or transcript' }, { status: 400 });
      }

      const sessionRef = await db.collection('ai_mock_sessions').add({
        userId: uid,
        category: interviewCategory,
        finalScore,
        transcript: transcript.map((item: any) => ({ role: item.role, content: item.content })),
        redFlagsTriggered: typeof redFlagsTriggered === 'number' ? redFlagsTriggered : 0,
        createdAt: Timestamp.now(),
      });

      return NextResponse.json({ success: true, sessionId: sessionRef.id });
    }

    return NextResponse.json({ error: 'Invalid action. Expected start, step, or complete.' }, { status: 400 });
  } catch (error: any) {
    console.error('Mock Interview API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
