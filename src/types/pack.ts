export type PackFieldType = 'file' | 'short_text' | 'long_text' | 'select';

export interface PackField {
  id: string;
  label: string;
  type: PackFieldType;
  options?: string[]; // for select
  required: boolean;
  category: string;
}

export interface PackFile {
  fileUrl: string;
  fileName: string;
  uploadedAt: any;
}

export interface StudentPackData {
  [fieldId: string]: string | PackFile;
}

export interface StudentPackConfig {
  customFields: PackField[];
}
