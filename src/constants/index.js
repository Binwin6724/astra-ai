/**
 * Application State Constants
 */
export const AssistantState = {
  IDLE: 'IDLE',
  CONNECTING: 'CONNECTING',
  LISTENING: 'LISTENING',
  THINKING: 'THINKING',
  SPEAKING: 'SPEAKING',
  ERROR: 'ERROR'
};

/**
 * Application Tab Constants
 */
export const AppTab = {
  ASSISTANT: 'assistant',
  DASHBOARD: 'dashboard',
  RESUME: 'resume',
  SETTINGS: 'settings'
};

/**
 * Job Status Constants
 */
export const JobStatus = {
  APPLIED: 'Applied',
  INTERVIEWING: 'Interviewing',
  REJECTED: 'Rejected',
  OFFER: 'Offer',
  GHOSTED: 'Ghosted'
};

/**
 * Voice Name Options
 */
export const VoiceNames = {
  ZEPHYR: 'Zephyr',
  PUCK: 'Puck',
  CHARON: 'Charon',
  KORE: 'Kore',
  FENRIR: 'Fenrir'
};

/**
 * Conciseness Levels
 */
export const ConcisenessLevels = {
  CONCISE: 'Concise',
  NORMAL: 'Normal',
  DETAILED: 'Detailed'
};

/**
 * Default Settings
 */
export const DEFAULT_SETTINGS = {
  userName: '',
  targetRole: '',
  voiceName: VoiceNames.ZEPHYR,
  conciseness: ConcisenessLevels.NORMAL,
  isGmailConnected: false,
  gmailAccessToken: '',
  gmailClientId: '',
  geminiApiKey: ''
};

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  JOBS: 'astra-jobs',
  SETTINGS: 'astra-settings'
};

/**
 * Audio Configuration
 */
export const AUDIO_CONFIG = {
  INPUT_SAMPLE_RATE: 16000,
  OUTPUT_SAMPLE_RATE: 24000,
  BUFFER_SIZE: 4096,
  FFT_SIZE: 256
};