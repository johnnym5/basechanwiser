// Resource management types
export interface Resource {
  id: string;
  title: string;
  type: "video" | "pdf" | "audio" | "doc";
  driveUrl: string;
  embedUrl?: string; // Processed Google Drive embed link for inline viewing
  attachedPackId?: string; // optional reference to a QuestionPack
  addedBy: string; // user uid
  authorName: string;
  createdAt?: any;
}

export interface SystemSettings {
  globalDriveFolderUrl?: string;
  defaultPassMark?: number; // e.g., 80
  offices?: string[]; // e.g., ["Abuja", "Lagos", "Benin"]
}
