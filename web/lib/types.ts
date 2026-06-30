export interface AuthProfile {
  id: string;
  username: string;
  displayName: string;
}

export interface AuthResponse {
  accessToken: string;
  profile: AuthProfile;
}

export interface ProfileDetail {
  id: string;
  username: string;
  displayName: string;
  headline: string | null;
  bio: string | null;
  city: string | null;
  countryCode: string | null;
  availability: string;
  avatarUrl: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
}

export interface DeclaredSkill {
  skillId: string;
  name: string;
  slug: string;
  category: string | null;
  level: number;
  isPrimary: boolean;
}

export interface ReputationScore {
  dimension: string;
  score: number;
  eventCount: number;
  factors: { type: string; count: number }[];
}

export interface ReputationResponse {
  profileId: string;
  scores: ReputationScore[];
}
export interface ProfileSummary {
  id: string;
  username: string;
  displayName: string;
  headline: string | null;
  city: string | null;
  countryCode: string | null;
  availability: string;
  avatarUrl: string | null;
}

export interface ProjectSkill {
  skillId: string;
  name: string;
  slug: string;
}

export interface ProjectMember {
  profileId: string;
  username: string;
  displayName: string;
  role: string;
  isOwner: boolean;
}

export interface Project {
  id: string;
  ownerId: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  status: string;
  visibility: string;
  sourceUrl: string | null;
  demoUrl: string | null;
  helpNeeded: string | null;
  members: ProjectMember[];
  skills: ProjectSkill[];
}

export interface FeedPost {
  id: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  groupId: string | null;
  kind: string;
  body: string;
  createdAt: string;
  commentCount: number;
  reactionCount: number;
}

export interface SearchResults {
  query: string;
  profiles: Array<{ id: string; username: string; displayName: string; headline: string | null; rank: number }>;
  projects: Array<{ id: string; slug: string; title: string; summary: string; status: string; rank: number }>;
}
