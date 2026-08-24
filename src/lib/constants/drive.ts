export const DRIVE_CONFIG = {
  FOLDER_ID: '1Wp7SweOk4_wZAVjpOpicYiQdVYR1EKNb',
  FULL_WORKSPACE_URL: 'https://drive.google.com/drive/folders/1Wp7SweOk4_wZAVjpOpicYiQdVYR1EKNb?usp=drive_link',
  EMBED_FOLDER_URL: 'https://drive.google.com/embeddedfolderview?id=1Wp7SweOk4_wZAVjpOpicYiQdVYR1EKNb#list',
};

/**
 * Transforms standard Google Drive file or folder links into embeddable preview URLs
 */
export function formatDriveEmbedUrl(urlInput: string): string {
  if (!urlInput || typeof urlInput !== 'string') return '';

  const trimmed = urlInput.trim();

  // 1. If it's a Google Drive Folder Link
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/) || trimmed.match(/id=([a-zA-Z0-9_-]+)/);
  if (trimmed.includes('drive.google.com') && folderMatch && folderMatch[1] && trimmed.includes('/folders/')) {
    return `https://drive.google.com/embeddedfolderview?id=${folderMatch[1]}#list`;
  }

  // 2. If it's a Google Drive File Link (PDF, MP4, Doc)
  const fileMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/id=([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  }

  // 3. Fallback: Return raw URL if it's an external direct link or already processed
  return trimmed;
}

/**
 * Legacy Helper (Maintaining compatibility)
 */
export function getEmbeddableDriveUrl(urlOrId: string): string {
  return formatDriveEmbedUrl(urlOrId);
}
