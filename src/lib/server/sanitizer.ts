// src/lib/server/sanitizer.ts

export interface SanitizationResult {
  sanitized: string;
  isTruncated: boolean;
  warnings: string[];
}

/**
 * Sanitizes user input for Gemini AI prompts.
 * 1. Prompt Injection Defense
 * 2. XSS & Code Injection Prevention
 * 3. Payload Truncation (default max 1000 chars)
 */
export function sanitizeInput(input: string, maxLength = 1000): SanitizationResult {
  const warnings: string[] = [];
  if (!input) {
    return { sanitized: "", isTruncated: false, warnings: [] };
  }

  let text = input;

  // 1. Prompt Injection Defense
  const injectionPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions/gi,
    /you\s+are\s+now\s+unrestricted/gi,
    /system\s*prompt\s*:/gi,
    /act\s+as\s+DAN/gi,
    /disregard\s+prior\s+guidelines/gi,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(text)) {
      warnings.push("Detected potential system prompt override phrase. Sanitized for safety.");
      text = text.replace(pattern, "[Sanitized Rule Override]");
    }
  }

  // 2. XSS & Code Injection Prevention
  // Strip raw tags like <script>, <iframe>, etc.
  const dangerTagPattern = /<\/?(script|iframe|object|embed|style|link|applet|form|meta)[^>]*>/gi;
  if (dangerTagPattern.test(text)) {
    warnings.push("Stripped script/code tags from input.");
    text = text.replace(dangerTagPattern, "");
  }

  // Strip javascript: pseudo-protocol
  text = text.replace(/javascript:\s*/gi, "");

  // Strip remaining HTML tags
  text = text.replace(/<[^>]*>/g, "");

  // Escape dangerous quote sequences if needed, but maintain standard text readability
  text = text.replace(/"{3,}/g, '"');

  // 3. Payload Truncation
  const trimmed = text.trim();
  let isTruncated = false;
  let finalResult = trimmed;

  if (trimmed.length > maxLength) {
    finalResult = trimmed.slice(0, maxLength);
    isTruncated = true;
    warnings.push(`Input exceeded max limit of ${maxLength} characters and was truncated.`);
  }

  return {
    sanitized: finalResult,
    isTruncated,
    warnings,
  };
}
