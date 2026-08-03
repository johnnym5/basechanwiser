// src/app/api/ai/verify-pack/route.ts
import { NextResponse } from 'next/server';
import { sanitizeInput } from '@/lib/server/sanitizer';
import { checkRateLimit } from '@/lib/server/rateLimiter';

/**
 * POST /api/ai/verify-pack
 * Body: { uid: string; role?: string; packData: Record<string, any> }
 * Performs AI Interview Pack Consistency Verification via Gemini API.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, role = 'Student', packData } = body;

    if (!uid || !packData) {
      return NextResponse.json({ error: 'Missing user ID (uid) or packData.' }, { status: 400 });
    }

    // 1. Rate Limiting Check
    const rateCheck = await checkRateLimit(uid, role);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: rateCheck.message }, { status: rateCheck.statusCode || 429 });
    }

    // 2. Sanitize user text fields in packData
    const sanitizedFields: Record<string, any> = {};
    const sanitizationWarnings: string[] = [];

    for (const [key, val] of Object.entries(packData)) {
      if (typeof val === 'string') {
        const result = sanitizeInput(val, 1500);
        sanitizedFields[key] = result.sanitized;
        if (result.warnings.length > 0) {
          sanitizationWarnings.push(...result.warnings);
        }
      } else {
        sanitizedFields[key] = val;
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is missing on backend server.' }, { status: 500 });
    }

    // 3. System Prompt for UKVI Compliance Officer
    const systemPrompt = `You are a Senior UKVI Student Visa Compliance Officer inspecting a student's UK Visa Interview Pack for credibility and consistency.

Analyze the student data provided below and return ONLY valid JSON with this exact structure:
{
  "score": <number 0-100>,
  "verdict": "<'Pass' | 'Needs Revision' | 'High Risk'>",
  "summary": "<1-2 sentence overall compliance evaluation>",
  "financialDiscrepancies": ["<list of any financial issues, e.g. sponsor income vs tuition+living cost gap>"],
  "logicalGaps": ["<list of gaps between course/university choice and future career goals>"],
  "genericVagueResponses": ["<list of unconvincing, generic, or memorized answers>"],
  "suggestedImprovements": ["<actionable advice to improve answers>"]
}

STUDENT INTERVIEW PACK DATA:
${JSON.stringify(sanitizedFields, null, 2)}`;

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
            generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
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
        score: 75,
        verdict: 'Needs Revision',
        summary: rawText,
        financialDiscrepancies: [],
        logicalGaps: [],
        genericVagueResponses: [],
        suggestedImprovements: ['Review responses for clarity and specificity.'],
      };
    }

    return NextResponse.json({
      success: true,
      data: parsedResult,
      warnings: sanitizationWarnings,
    });
  } catch (error: any) {
    console.error('Verify Pack API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
