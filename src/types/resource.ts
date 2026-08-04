// Resource management types
export interface Resource {
  id: string;
  title: string;
  type: "video" | "pdf" | "audio" | "doc";
  driveUrl: string;
  embedUrl?: string; // Processed Google Drive embed link for inline viewing
  attachedPackId?: string; // optional reference to a QuestionPack
  tags?: string[];
  validUntil?: any; // Timestamp
  clicks?: number;
  views?: number;
  addedBy: string; // user uid
  authorName: string;
  createdAt?: any;
}

export interface LibraryResource {
  id: string;
  title: string;
  description: string;
  fileType: 'pdf' | 'video' | 'doc' | 'link';
  fileUrl: string;
  linkedPackId: string;
  createdAt: any;
  createdBy: string;
}

export interface EmailTemplates {
  welcome?: string;
  quizFailed?: string;
  formVerified?: string;
}

export interface SystemSettings {
  globalDriveFolderUrl?: string;
  defaultPassMark?: number; // e.g., 80
  offices?: string[]; // e.g., ["Abuja", "Lagos", "Benin"]
  quizRetakeCooldownHours?: number;
  maxRetakes?: number;
  maintenanceMode?: boolean;
  passwordPolicyStrict?: boolean;
  emailTemplates?: EmailTemplates;
  globalAIPromptOverrides?: string;
}
