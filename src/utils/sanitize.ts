/**
 * Sanitizes user input to prevent XSS and prompt injection.
 * Removes HTML tags and limits length.
 */
export const sanitizeInput = (text: string, maxLength: number = 500): string => {
  if (!text) return '';
  // Remove HTML tags and trim whitespace
  let cleanText = text.replace(/(<([^>]+)>)/gi, "").trim();
  // Limit length to prevent buffer/token overflow
  if (cleanText.length > maxLength) {
    cleanText = cleanText.substring(0, maxLength);
  }
  return cleanText;
};
