// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

// Auth Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

// Message Types
export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  type: MessageType;
  fileUrl?: string;
  tokens?: number;
  createdAt: string;
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export enum MessageType {
  TEXT = 'TEXT',
  VOICE = 'VOICE',
  FILE = 'FILE',
  IMAGE = 'IMAGE',
}

// Conversation Types
export interface Conversation {
  id: string;
  title: string;
  userId: string;
  agentId?: string;
  isStarred: boolean;
  isPinned: boolean;
  messages?: Message[];
  createdAt: string;
  updatedAt: string;
}

// Agent Types
export interface Agent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  avatar?: string;
  personality: string;
  model: AIModel;
  userId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum AIModel {
  GPT_4O = 'gpt-4o',
  GPT_4O_MINI = 'gpt-4o-mini',
  GPT_4_TURBO = 'gpt-4-turbo',
}

// File Types
export interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  userId: string;
  conversationId?: string;
  summary?: string;
  createdAt: string;
}

// Analytics Types
export interface AnalyticsData {
  totalConversations: number;
  totalMessages: number;
  totalVoiceSessions: number;
  totalTokensUsed: number;
  dailyUsage: DailyUsage[];
  monthlyUsage: MonthlyUsage[];
}

export interface DailyUsage {
  date: string;
  conversations: number;
  messages: number;
  tokens: number;
}

export interface MonthlyUsage {
  month: string;
  conversations: number;
  messages: number;
  tokens: number;
}

// Socket Events
export enum SocketEvent {
  // Voice
  VOICE_START = 'voice:start',
  VOICE_STOP = 'voice:stop',
  VOICE_TRANSCRIPT = 'voice:transcript',
  VOICE_RESPONSE = 'voice:response',
  VOICE_AUDIO = 'voice:audio',
  VOICE_ERROR = 'voice:error',

  // Chat
  CHAT_MESSAGE = 'chat:message',
  CHAT_STREAM = 'chat:stream',
  CHAT_STREAM_END = 'chat:stream_end',
  CHAT_ERROR = 'chat:error',

  // Notifications
  NOTIFICATION = 'notification',

  // Connection
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
}

// API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Settings
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  voiceEnabled: boolean;
  voiceId: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
}

// Notification
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}
