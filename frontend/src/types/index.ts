/**
 * User types
 */
export enum UserRole {
  STUDENT = 'student',
  TUTOR = 'tutor',
  ADMIN = 'admin'
}

export interface User {
  id: string;
<<<<<<< HEAD
=======
  _id: string; // MongoDB ID
>>>>>>> ai_feature_clean
  username: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
<<<<<<< HEAD
  createdAt: string;
=======
  approved?: boolean;
  createdAt?: string;
  updatedAt?: string;
>>>>>>> ai_feature_clean
}

/**
 * Virtual Space types
 */
export enum SpaceStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  EXPIRED = 'expired'
}

export interface VirtualSpace {
  _id: string;
  spaceCode: string;
  qrCode: string;
  tutorId: User;
  name: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: SpaceStatus;
  participants: User[];
<<<<<<< HEAD
=======
  participantCount?: number; // Actual count from StudentParticipant collection
  aiSessionSummary?: string; // AI-generated summary
>>>>>>> ai_feature_clean
  createdAt: string;
  updatedAt: string;
}

/**
 * Post types
 */
export enum InputType {
  TEXT = 'text',
  OCR = 'ocr',
  VOICE = 'voice'
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  VERY_HARD = 'very_hard',
  UNRANKED = 'unranked'
}

export interface KnowledgePoint {
  topic: string;
  subtopic?: string;
  concept: string;
}

export interface MediaAttachment {
  url: string;
  type: string;
  originalName: string;
}

<<<<<<< HEAD
export interface Post {
  _id: string;
  spaceId: string | VirtualSpace;
  studentId: User;
=======
export interface StudentComment {
  participantId: string;
  nickname: string;
  comment: string;
  timestamp: string;
}

export interface Post {
  _id: string;
  spaceId: string | VirtualSpace;
  studentId: User | string;
  studentNickname?: string; // For anonymous students
>>>>>>> ai_feature_clean
  question: string;
  inputType: InputType;
  originalText?: string;
  mediaAttachments: MediaAttachment[];
  difficultyLevel: DifficultyLevel;
  difficultyScore: number;
  knowledgePoints: KnowledgePoint[];
<<<<<<< HEAD
=======
  aiHint?: string; // AI-generated hint for tutor
  keyConceptsDefinitions?: { term: string; definition: string }[];
  studentComments?: StudentComment[]; // Student-to-student responses
>>>>>>> ai_feature_clean
  tutorResponse?: string;
  isAnswered: boolean;
  answeredAt?: string;
  answeredBy?: User;
  createdAt: string;
  updatedAt: string;
}

/**
 * Session types
 */
export interface SessionStatistics {
  totalPosts: number;
  answeredPosts: number;
  unansweredPosts: number;
  participantCount: number;
  averageDifficultyScore: number;
}

export interface ArchivedSession {
  _id: string;
  spaceId: VirtualSpace;
  startTime: string;
  endTime: string;
  actualEndTime?: string;
  statistics: SessionStatistics;
  archivedData: any;
  isArchived: boolean;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Auth types
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface AuthResponse {
  user: User;
<<<<<<< HEAD
  token: string;
  message: string;
=======
  token?: string;
  message: string;
  requiresApproval?: boolean;
>>>>>>> ai_feature_clean
}
