/**
 * TypeScript interfaces generated from the Turnpike Analyst Enterprise
 * Platform OpenAPI 3.1 specification.
 * Source: https://turnpike-analyst.onrender.com/openapi.json
 */

export type UserRole = "ADMIN" | "CONSULTANT" | "INSTRUCTOR" | "CLIENT";

export type LeadStatus = "PENDING" | "IN_PROGRESS" | "RESOLVED" | "CANCELLED";
export type LeadType = "BOOK_CALL" | "REQUIREMENT_FORM" | "PRODUCT_DEMO";
export type Department = "TECHNICAL_TEAM" | "MANAGEMENT_TEAM" | "HELP_DESK";

export type ApplicationStatus = "SUBMITTED" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED";

export type BlogCategory = "UNCATEGORIZED" | "ICC" | "KOFAX" | "HYLAND" | "AI_INNOVATION";

export type CourseCategory = "ECM_TRAINING" | "OCP_TRAINING" | "CLOUD_DEVOPS" | "AI_ML_TRAINING";
export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type ProductCode = "JAMES_WEBB" | "AGENT_P8";

export type ParentCategory =
  | "APPLICATIONS"
  | "ARTIFICIAL_AUGMENTED_INTELLIGENCE"
  | "BUSINESS_PROCESS"
  | "BUSINESS_SOLUTIONS"
  | "CLOUD"
  | "CONSULTING"
  | "CYBERSECURITY"
  | "DATA_ANALYTICS"
  | "DESIGN_EXPERIENCE"
  | "DIGITAL_MARKETING_INTERACTION"
  | "ENGINEERING"
  | "INFRASTRUCTURE"
  | "SUSTAINABILITY"
  | "TALENT_CLOUD"
  | "DIGITAL_CONTENT_SERVICES";

export type SubServiceType =
  | "DIGITAL_CONTENT_MIGRATION"
  | "DIGITAL_CONTENT_CAPTURE"
  | "MANAGED_SERVICES"
  | "SOFTWARE_SUPPORT"
  | "BPM_RPA"
  | "CRM_ERP_INTEGRATION"
  | "SEO_MARKETING"
  | "CUSTOM_ENGINEERING";

export const USER_ROLES: UserRole[] = ["ADMIN", "CONSULTANT", "INSTRUCTOR", "CLIENT"];
export const LEAD_STATUSES: LeadStatus[] = ["PENDING", "IN_PROGRESS", "RESOLVED", "CANCELLED"];
export const LEAD_TYPES: LeadType[] = ["BOOK_CALL", "REQUIREMENT_FORM", "PRODUCT_DEMO"];
export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "ACCEPTED",
  "REJECTED",
];
export const BLOG_CATEGORIES: BlogCategory[] = [
  "UNCATEGORIZED",
  "ICC",
  "KOFAX",
  "HYLAND",
  "AI_INNOVATION",
];
export const COURSE_CATEGORIES: CourseCategory[] = [
  "ECM_TRAINING",
  "OCP_TRAINING",
  "CLOUD_DEVOPS",
  "AI_ML_TRAINING",
];
export const COURSE_LEVELS: CourseLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
export const PARENT_CATEGORIES: ParentCategory[] = [
  "APPLICATIONS",
  "ARTIFICIAL_AUGMENTED_INTELLIGENCE",
  "BUSINESS_PROCESS",
  "BUSINESS_SOLUTIONS",
  "CLOUD",
  "CONSULTING",
  "CYBERSECURITY",
  "DATA_ANALYTICS",
  "DESIGN_EXPERIENCE",
  "DIGITAL_MARKETING_INTERACTION",
  "ENGINEERING",
  "INFRASTRUCTURE",
  "SUSTAINABILITY",
  "TALENT_CLOUD",
  "DIGITAL_CONTENT_SERVICES",
];
export const SUB_SERVICE_TYPES: SubServiceType[] = [
  "DIGITAL_CONTENT_MIGRATION",
  "DIGITAL_CONTENT_CAPTURE",
  "MANAGED_SERVICES",
  "SOFTWARE_SUPPORT",
  "BPM_RPA",
  "CRM_ERP_INTEGRATION",
  "SEO_MARKETING",
  "CUSTOM_ENGINEERING",
];

export interface UserResponse {
  _id?: string;
  full_name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  title?: string | null;
  role?: UserRole;
  is_active?: boolean;
  created_at?: string;
  /** Persisted UI preference; the API accepts it on PATCH /auth/me. */
  theme?: "light" | "dark" | null;
}

export interface UserCreate {
  full_name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  title?: string | null;
  password: string;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type?: string;
}

export interface LoginResponse extends Token {
  user: UserResponse;
}

export interface ServiceResponse {
  _id?: string;
  title: string;
  slug: string;
  parent_category: ParentCategory;
  sub_service_type: SubServiceType;
  short_description: string;
  full_description: string;
  supported_platforms?: string[];
  is_featured?: boolean;
  sections?: { heading: string; text: string }[];
  created_at?: string;
}

export type ServiceCreate = Omit<ServiceResponse, "_id" | "created_at">;
export type ServiceUpdate = Partial<ServiceCreate>;

export interface IndustryResponse {
  _id?: string;
  title: string;
  slug: string;
  parent_category: string;
  short_description: string;
  full_description: string;
  supported_platforms?: string[];
  is_featured?: boolean;
  sections?: { heading: string; text: string }[];
  created_at?: string;
}

export type IndustryCreate = Omit<IndustryResponse, "_id" | "created_at">;
export type IndustryUpdate = Partial<IndustryCreate>;


export interface LeadResponse {
  _id?: string;
  type: LeadType;
  full_name: string;
  email: string;
  phone: string;
  company: string;
  department?: Department;
  subject: string;
  message: string;
  service_id?: string | null;
  status?: LeadStatus;
  sla_reply_deadline?: string;
  created_at?: string;
}

export interface BlogResponse {
  _id?: string;
  title: string;
  slug: string;
  category?: BlogCategory;
  author: string;
  content_html: string;
  summary: string;
  tags?: string[];
  is_published?: boolean;
  published_at?: string;
}

export type BlogCreate = Omit<BlogResponse, "_id" | "published_at">;

export interface CourseResponse {
  _id?: string;
  title: string;
  slug: string;
  category: CourseCategory;
  duration_hours: number;
  level: CourseLevel;
  curriculum?: Record<string, unknown>[];
  instructor_id?: string | null;
  price: number;
  is_published?: boolean;
}

export interface ProductResponse {
  _id?: string;
  product_code: ProductCode;
  name: string;
  tagline: string;
  description: string;
  key_features?: string[];
  supported_environments?: string[];
  pricing_tiers?: Record<string, unknown>[];
  is_active?: boolean;
}

export interface InstructorApplicationResponse {
  _id?: string;
  full_name: string;
  email: string;
  phone: string;
  expertise_areas?: string[];
  resume_url: string;
  status?: ApplicationStatus;
  submitted_at?: string;
}

export interface NewsletterResponse {
  _id?: string;
  email: string;
  subscribed_at?: string;
  is_active?: boolean;
}

export interface DemoRequestCreate {
  full_name: string;
  email: string;
  phone: string;
  company: string;
  product_code: ProductCode;
  message: string;
}

export interface MessageResponse {
  message: string;
}

export interface PageParams {
  skip?: number;
  limit?: number;
}
