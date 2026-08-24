export const DRIVE_CONFIG = {
  FOLDER_ID: '1Wp7SweOk4_wZAVjpOpicYiQdVYR1EKNb',
  FULL_WORKSPACE_URL: 'https://drive.google.com/drive/folders/1Wp7SweOk4_wZAVjpOpicYiQdVYR1EKNb?usp=drive_link',
  EMBED_FOLDER_URL: 'https://drive.google.com/embeddedfolderview?id=1Wp7SweOk4_wZAVjpOpicYiQdVYR1EKNb#list',
};

/**
 * Transforms standard Google Drive file links into embeddable preview URLs
 */
export function getEmbeddableDriveUrl(urlOrId: string): string {
  if (!urlOrId) return '';

  // Extract ID if full URL passed
  let fileId = urlOrId;
  const match = urlOrId.match(/\/d\/([a-zA-Z0-9_-]+)/) || urlOrId.match(/id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    fileId = match[1];
  }

  return `https://drive.google.com/file/d/${fileId}/preview`;
}
