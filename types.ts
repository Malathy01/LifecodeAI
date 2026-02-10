
export type UserRole = 'USER' | 'PROFESSIONAL';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  licenseNumber?: string; // For professionals
  specialty?: string;
  isVerified?: boolean;
}

export interface Verdict {
  claim: string;
  summary: string;
  confidenceScore: number;
  status: 'TRUE' | 'FALSE' | 'PARTIAL' | 'UNVERIFIED' | 'MISLEADING';
  evidenceCount: number;
  sources: { title: string; url: string }[];
  definitions: { term: string; explanation: string }[];
  relatedClaims: string[];
  doctorComment?: string;
}

export interface CommunityPost {
  id: string;
  authorName: string;
  authorId: string;
  isProfessional: boolean;
  content: string;
  likes: number;
  timestamp: number;
  comments: Comment[];
}

export interface Comment {
  id: string;
  authorName: string;
  content: string;
  timestamp: number;
}

export interface TrendingTopic {
  id: string;
  topic: string;
  count: number;
  type: 'INGREDIENT' | 'CLAIM';
}

export interface PatientQuestion {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
  verdict?: Verdict;
  doctorResponse?: string;
  status: 'OPEN' | 'ANSWERED';
}
