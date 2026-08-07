export interface RubricCriteria {
  id: string;
  label: string;
  maxScore: number;
}

export interface GlobalSettings {
  primaryColor: string;
  logoUrl?: string;
  dataRetentionDays: number;
  globalRubric: RubricCriteria[];
  maintenanceMode: boolean;
  defaultPassMark: number;
  offices: string[];
}

export interface UserPermissions {
  canDownloadDocuments: boolean;
  canEditSettings: boolean;
  canDeleteUsers: boolean;
  canManageModules: boolean;
}

export interface UserPreferences {
  timezone: string;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  lowBandwidthMode: boolean;
  themePreference: 'light' | 'dark' | 'system';
}
