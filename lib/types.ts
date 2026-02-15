export type UserRole = "student" | "founder" | "mentor" | "admin";

export type StartupStage = "Idea Phase" | "MVP/Prototype" | "Early Traction" | "Scaling" | "Mentor/Investor";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  college: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  skills: string[];
  interests: string[];
  startup_stage: StartupStage | null;
  is_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export type PostType = "text" | "image" | "video" | "link";

export interface Post {
  id: number;
  user_id: string;
  title: string | null;
  content: string;
  post_type: PostType;
  media_url: string | null;
  link_url: string | null;
  tags: string[];
  upvotes_count: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  likes_count: number;
  created_at: string;
  profiles?: Profile;
  replies?: Comment[];
}

export interface Upvote {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface SavedPost {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
  posts?: Post;
}

export type ResourceType =
  | "article"
  | "video"
  | "tool"
  | "template"
  | "course"
  | "book";

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string;
  resource_type: ResourceType;
  category: string;
  thumbnail_url: string | null;
  is_featured: boolean;
  created_by: string | null;
  created_at: string;
}

export interface AIChat {
  id: string;
  user_id: string;
  title: string;
  messages: AIMessage[];
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export type NotificationType = "upvote" | "comment" | "reply" | "follow" | "mention";

export interface Notification {
  id: number;
  user_id: string;
  actor_id: string;
  type: NotificationType;
  post_id: number | null;
  comment_id: number | null;
  message: string | null;
  is_read: boolean;
  created_at: string;
  actor?: Profile;
  post?: Post;
}
