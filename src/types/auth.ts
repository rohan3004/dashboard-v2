export interface UserProfile {
  username: string;
  roles: string[];
  exp?: number;
}

export interface AuthResponse {
  accessToken?: string;
  tokenType?: string;
  newUser?: boolean;
  isNewUser?: boolean; // Fallback
  registrationToken?: string;
  email?: string;
  message?: string;
}

export interface RegistrationPayload {
  registrationToken: string;
  username: string;
  fullName: string;
  phoneNumber: string;
  gender?: string;
  dateOfBirth: string;
  country: string;
  state: string;
  city: string;
  pinCode: string;
  codechefHandle?: string;
  codeforcesHandle?: string;
  gfgHandle?: string;
  leetcodeHandle?: string;
  // Device Data
  deviceId: string;
  platform: string;
  osVersion: string;
  appVersion: string;
  screenResolution: string;
  language: string;
  referralSource?: string;
}

export interface Notification {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface ScraperParams {
  default_user?: string;
  codechef?: string;
  codeforces?: string;
  geeksforgeeks?: string;
  leetcode?: string;
}

export interface HealthData {
  server: string;
  database: string;
  usedMemory: number;
  availableProcessors: number;
  version: string;
  timestamp: string;
  legal: string;
}