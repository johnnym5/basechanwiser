// src/app/api/ai/mock-interview/route.ts
import { NextResponse } from 'next/server';
import { sanitizeInput } from '@/lib/server/sanitizer';
import { checkRateLimit } from '@/lib/server/rateLimiter';

/**
 * POST /api/ai/mock-interview
 * Body: {
 *   uid: string;
 *   role?: string;
 *   questionText: string;
 *   studentResponse: string;
 *   targetUniversity?: string;
 *   courseName?: string;
 * }
 * Evaluates student answer based on UKVI credibility criteria.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      uid,
      role = 'Student',
      questionText,
      studentResponse,
      targetUniversity = 'UK University',
      courseName = 'Degree Program',
    } = body;

    if (!uid || !questionText || !studentResponse) {
      return NextResponse.json(
        { error: 'Missing required fields: uid, questionText, or studentResponse.' },
        { status: 400 }
      );
    }

    // 1. Rate Limiting Check
    const rateCheck = await checkRateLimit(uid, role);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: rateCheck.message }, { status: rateCheck.statusCode || 429 });
    }

    // 2. Input Sanitization
    const sanitizedQuestion = sanitizeInput(questionText, 500);
    const sanitizedAnswer = sanitizeInput(studentResponse, 1500);
    const sanitizationWarnings = [
      ...sanitizedQuestion.warnings,
      ...sanitizedAnswer.warnings,
    ];

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is missing on backend server.' }, { status: 500 });
    }

    // 3. System Prompt for UKVI Practice Coach
    const systemPrompt = `You are an expert UK Credibility Interview Coach helping an international student prepare for their UK Visa & University Admission Interview.

TARGET UNIVERSITY: ${targetUniversity}
COURSE NAME: ${courseName}
INTERVIEW QUESTION: "${sanitizedQuestion.sanitized}"
STUDENT'S SPOKEN/WRITTEN ANSWER: "${sanitizedAnswer.sanitized}"

Evaluate the student's response based strictly on UKVI Credibility Criteria:
1. Financial Precision & Accuracy
2. Course & University Knowledge Depth
3. Authenticity & Natural Tone (Non-memorized)
4. Clarity of Future Career Progression

Return ONLY valid JSON matching this exact structure:
{
  "confidenceScore": <number 0-100>,
  "grade": "<'Strong Pass' | 'Pass with Notes' | 'Needs Work' | 'Critical Failure'>",
  "feedback": "<2-3 sentence constructive evaluation>",
  "financialPrecision": "<evaluation of financial figures mentioned>",
  "courseKnowledge": "<evaluation of course module awareness>",
  "authenticity": "<evaluation of tone>",
  "actionableImprovements": [
    "<point 1>",
    "<point 2>"
  ],
  "improvedSampleAnswer": "<A polished, natural version of the student's answer that maintains their personal facts>"
}`;

    // 4. Query Gemini API with active supported models
    const modelsToTry = ['gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-1.5-flash'];
    let response: Response | null = null;
    let lastErr = '';

    for (const modelName of modelsToTry) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      try {
        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
          }),
        });

        if (res.ok) {
          response = res;
          break;
        } else {
          lastErr = await res.text();
        }
      } catch (err: any) {
        lastErr = err.message;
      }
    }

    if (!response || !response.ok) {
      return NextResponse.json({ error: 'Gemini AI service error', details: lastErr }, { status: 502 });
    }

    const geminiRes = await response.json();
    const rawText = geminiRes?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    let parsedResult = null;
    try {
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleanJson);
    } catch {
      parsedResult = {
        confidenceScore: 70,
        grade: 'Pass with Notes',
        feedback: rawText,
        financialPrecision: 'Provide specific tuition figures.',
        courseKnowledge: 'Include specific modules.',
        authenticity: 'Good tone.',
        actionableImprovements: ['Add specific course details.'],
        improvedSampleAnswer: studentResponse,
      };
    }

    return NextResponse.json({
      success: true,
      data: parsedResult,
      warnings: sanitizationWarnings,
    });
  } catch (error: any) {
    console.error('Mock Interview API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
