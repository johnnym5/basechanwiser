// src/app/api/ai/assistant/route.ts
import { NextResponse } from 'next/server';
import { sanitizeInput } from '@/lib/server/sanitizer';
import { checkRateLimit } from '@/lib/server/rateLimiter';

export interface AIContextPayload {
  userRole: 'Student' | 'Counselor' | 'Admin';
  userUid: string;
  currentRoute: string;
  activeEntityData?: {
    studentId?: string;
    studentName?: string;
    readinessStatus?: string;
    quizScores?: Record<string, number>;
    weakTopics?: string[];
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, history = [], context } = body as {
      message: string;
      history: { sender: 'user' | 'assistant'; text: string }[];
      context: AIContextPayload;
    };

    if (!message || !context || !context.userUid) {
      return NextResponse.json({ error: 'Missing required parameters: message and context.' }, { status: 400 });
    }

    // 1. Rate Limiting Check
    const rateCheck = await checkRateLimit(context.userUid, context.userRole);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: rateCheck.message }, { status: rateCheck.statusCode || 429 });
    }

    // 2. Sanitize user message input
    const sanitizedMsg = sanitizeInput(message, 1500);
    let promptInput = sanitizedMsg.sanitized;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key missing on server.' }, { status: 500 });
    }

    // 3. Contextual Student Directory Data (Injected from Client Context if available)
    let studentLookupDataStr = "";

    // 4. Build System Persona & Prompt based on Role
    let systemInstruction = "";

    if (context.userRole === 'Student') {
      systemInstruction = `You are BASECHANWISER Copilot, a 24/7 UKVI Pre-CAS Interview Coach and Student Mentor.
Your mission is to guide international students preparing for UK university credibility interviews and UKVI compliance requirements.

CORE RESPONSIBILITIES:
1. Answer questions clearly regarding UK visa regulations, CAS (Confirmation of Acceptance for Studies), 28-day maintenance fund rules, work hour limits (20 hrs/week term-time), and course progression.
2. Provide constructive feedback on student draft answers to interview questions.
3. Keep answers concise, highly structured (using bullet points or bold text), friendly, and encouraging.

CURRENT APP CONTEXT:
- Student UID: ${context.userUid}
- Current Active Route: ${context.currentRoute}
${context.activeEntityData ? `- Active Page Context: ${JSON.stringify(context.activeEntityData)}` : ''}`;

    } else {
      // Counselor / Admin Role
      systemInstruction = `You are BASECHANWISER Copilot, a Senior Compliance Operations Copilot & Data Analyst for Basechan Counselors and Admins.

CORE RESPONSIBILITIES:
1. Assist counselors with student progress analysis, UKVI risk evaluations, and customized recovery plan creation.
2. Query and interpret student directory data, readiness traffic lights (Green/Yellow/Red), and assigned question packs.
3. ACTION TOOL TRIGGER (CRITICAL): When a counselor asks you to generate, create, or recommend a targeted recovery question pack for a student (e.g. "Generate a targeted question pack for Johnmary based on their score" or "Create a recovery pack for [Student Name]"), construct a 3 to 5 question recovery drill tailored to their weak areas (e.g., Financial Credibility, Career Intent, UKVI Visa Rules).

IMPORTANT: When generating a question pack, you MUST return a valid JSON object embedded inside your response with the following format:

\`\`\`json
{
  "action": {
    "type": "CREATE_TAILORED_PACK",
    "targetStudentId": "<student_uid_or_name>",
    "packTitle": "<Descriptive Pack Title, e.g. Financial Credibility Recovery Drill>",
    "category": "Financial Credibility",
    "questions": [
      {
        "questionText": "<Question String>",
        "options": [
          { "text": "<Option 1>", "isCorrect": true },
          { "text": "<Option 2>", "isCorrect": false },
          { "text": "<Option 3>", "isCorrect": false }
        ],
        "explanation": "<Explanation string>"
      }
    ]
  }
}
\`\`\`

Explain the rationale in natural conversational text alongside the json action block.

CURRENT APP CONTEXT:
- Counselor/Admin UID: ${context.userUid}
- Current Active Route: ${context.currentRoute}
${context.activeEntityData ? `- Active Page Context: ${JSON.stringify(context.activeEntityData)}` : ''}
${studentLookupDataStr}`;
    }

    // 5. Construct Conversation Payload for Gemini
    const contents: any[] = [];
    
    // System instruction injected as first user turn if needed, or system_instruction field
    const contentsPayload = [
      {
        role: 'user',
        parts: [{ text: `SYSTEM INSTRUCTION:\n${systemInstruction}\n\nPlease keep your response focused and formatted in clear Markdown.` }]
      },
      {
        role: 'model',
        parts: [{ text: `Understood! I am ready as BASECHANWISER Copilot for role: ${context.userRole}. How can I assist you right now?` }]
      }
    ];

    // Add recent conversation history
    for (const h of history.slice(-6)) {
      contentsPayload.push({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      });
    }

    // Add current prompt
    contentsPayload.push({
      role: 'user',
      parts: [{ text: promptInput }]
    });

    // 6. Gemini API Call with active supported v1beta models
    const modelsToTry = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest',
      'gemini-1.5-flash',
    ];

    let response: Response | null = null;
    let lastErrorText = '';

    for (const modelName of modelsToTry) {
      const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      try {
        const res = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: contentsPayload }),
        });

        if (res.ok) {
          response = res;
          break;
        } else {
          lastErrorText = await res.text();
          console.warn(`[Gemini API Warning]: Model ${modelName} returned status ${res.status}:`, lastErrorText);
        }
      } catch (fetchErr: any) {
        console.warn(`[Gemini API Warning]: Fetch to ${modelName} failed:`, fetchErr.message);
        lastErrorText = fetchErr.message;
      }
    }

    if (!response || !response.ok) {
      console.error('[Gemini API Service Exhausted All Models]:', lastErrorText);
      return NextResponse.json(
        { 
          error: `Gemini AI service error: Unable to reach Gemini models. Details: ${lastErrorText.slice(0, 200)}`, 
          details: lastErrorText 
        }, 
        { status: 502 }
      );
    }

    const geminiRes = await response.json();
    const rawText = geminiRes?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'I apologize, I could not process your request at this moment.';

    // Check if JSON action was returned inside rawText
    let actionPayload: any = null;
    let cleanText = rawText;

    const jsonBlockMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
      try {
        const parsed = JSON.parse(jsonBlockMatch[1]);
        if (parsed.action) {
          actionPayload = parsed.action;
          cleanText = rawText.replace(/```json\s*[\s\S]*?\s*```/, '').trim();
        }
      } catch (e) {
        // Not valid action JSON, leave text intact
      }
    }

    return NextResponse.json({
      success: true,
      text: cleanText || rawText,
      action: actionPayload,
      warnings: sanitizedMsg.warnings
    });

  } catch (error: any) {
    console.error('[Gemini API Assistant Route Fatal Error]:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
