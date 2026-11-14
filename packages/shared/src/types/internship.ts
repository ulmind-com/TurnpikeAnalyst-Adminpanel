/** Types for the internship programme, mirroring app/schemas/internship.py. */

export type TrackCategory =
  | "FRONTEND"
  | "BACKEND"
  | "FULLSTACK"
  | "DATA_ENGINEERING"
  | "DEVOPS"
  | "AI_ML";

export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type InternshipStatus =
  | "ENROLLED"
  | "SUBMITTED"
  | "AI_REVIEWING"
  | "QUESTIONS_PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED"
  | "REVIEW_FAILED";

export interface InternshipTrack {
  _id: string;
  title: string;
  slug: string;
  category: TrackCategory;
  level: CourseLevel;
  summary: string;
  brief: string;
  requirements: string[];
  deliverables: string[];
  suggested_stack: string[];
  build_days: number;
  cover_image_url?: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export type TrackCreate = Omit<InternshipTrack, "_id" | "created_at" | "updated_at">;
export type TrackUpdate = Partial<TrackCreate>;

export type EnrollmentMode = "TRACK" | "OWN";

/** An architecture or data-flow diagram: Mermaid source, or an uploaded image. */
export interface Diagram {
  kind: "mermaid" | "image";
  mermaid?: string | null;
  asset_id?: string | null;
}

export interface RepoEntryPayload {
  url: string;
  role: "monorepo" | "frontend" | "backend" | "admin" | "mobile" | "api" | "other" | string;
  label?: string | null;
}

/** The project dossier — everything the candidate submits. */
export interface Submission {
  repo_url: string;
  repositories?: RepoEntryPayload[];
  project_architecture_type?: "single" | "multiple" | string;
  live_url?: string | null;
  notes?: string | null;
  submitted_at: string;

  demo_video_url?: string | null;
  purpose?: string | null;
  technologies: string[];
  architecture_text?: string | null;
  architecture_diagram?: Diagram | null;
  data_flow_text?: string | null;
  data_flow_diagram?: Diagram | null;
  use_cases: string[];
  benefits?: string | null;
}

export interface SubmissionPayload {
  repo_url?: string;
  repositories?: RepoEntryPayload[];
  project_architecture_type?: "single" | "multiple";
  live_url?: string;
  demo_video_url: string;
  purpose: string;
  technologies: string[];
  architecture_text: string;
  architecture_diagram: Diagram;
  data_flow_text: string;
  data_flow_diagram: Diagram;
  use_cases: string[];
  benefits: string;
  notes?: string;
}

export interface OwnProjectProposal {
  title: string;
  summary: string;
  intended_stack: string[];
}

export interface EnrollPayload {
  mode: EnrollmentMode;
  track_id?: string;
  own_project?: OwnProjectProposal;
  duration_months: number;
}

export interface Attachment {
  asset_id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  url: string;
}

/** The intern's uploaded project source archive (a .zip). */
export interface SourceArchive {
  asset_id: string;
  filename: string;
  size_bytes: number;
  uploaded_at: string;
  /** Ownership-checked download route; also serves admins. */
  download_url?: string | null;
}

export interface AnswerTelemetry {
  time_spent_seconds: number;
  keystrokes: number;
  paste_attempts: number;
  blur_count: number;
}

export interface FollowUpQuestion {
  id: string;
  question: string;
  /** What a strong answer demonstrates. Admin-only; absent in intern responses. */
  expects?: string;
  answer?: string | null;
  answered_at?: string | null;
  telemetry?: AnswerTelemetry | null;
}

export interface ReviewFinding {
  area: string;
  severity: "info" | "minor" | "major";
  detail: string;
}

/** Whether the repository backs up something the intern wrote down. */
export interface ClaimCheck {
  claim: string;
  verdict: "supported" | "partial" | "unsupported";
  evidence: string;
}

export interface AiReview {
  score: number;
  verdict: "strong" | "acceptable" | "weak";
  summary: string;
  strengths: string[];
  concerns: string[];
  detected_stack: string[];
  findings: ReviewFinding[];
  claim_checks: ClaimCheck[];
  repo_facts: Record<string, unknown>;
  repos_facts?: Array<Record<string, unknown>>;
  /** Facts about the uploaded source archive the review compared the repo to. */
  archive_facts?: Record<string, unknown> | null;
  /** Facts about the deployed live site inspected during review. */
  live_site_facts?: Record<string, unknown> | null;
  model: string;
  reviewed_at: string;
}

export interface QuestionAnswerAssessment {
  question_id: string;
  ai_likelihood: "low" | "medium" | "high";
  reason: string;
}

export interface AnswerAuthenticityReport {
  overall_authenticity_score: number;
  ai_generated_likelihood: "low" | "medium" | "high";
  summary: string;
  flags: string[];
  per_question: QuestionAnswerAssessment[];
  analyzed_at: string;
  model: string;
}

export interface DecisionRecord {
  approved: boolean;
  notes?: string | null;
  demo_verified: boolean;
  decided_by: string;
  decided_at: string;
}

/** What the intern sees — deliberately without the automated review. */
export interface Enrollment {
  _id: string;
  status: InternshipStatus;

  mode: EnrollmentMode;
  duration_months: number;
  /** Set for both modes, so screens never branch on where the project came from. */
  project_title: string;
  project_summary?: string | null;

  track_id?: string | null;
  track_title?: string | null;
  track_slug?: string | null;
  enrolled_at: string;
  deadline_at: string;
  submission?: Submission | null;
  source_archive?: SourceArchive | null;
  questions: FollowUpQuestion[];
  review_due_at?: string | null;
  certificate_id?: string | null;
  decision_notes?: string | null;
  review_failed?: boolean;
}

/** What an admin sees — the same attempt, plus the full report. */
export interface EnrollmentAdmin extends Enrollment {
  user_id: string;
  /** The intern's identity, joined from the users collection (admin only). */
  user_name?: string | null;
  user_email?: string | null;
  ai_review?: AiReview | null;
  answer_analysis?: AnswerAuthenticityReport | null;
  decision?: DecisionRecord | null;
  review_error?: string | null;
}

export interface AnswerItemPayload {
  id: string;
  answer: string;
  telemetry?: AnswerTelemetry;
}

export interface AnswerPayload {
  answers: AnswerItemPayload[];
}

export interface RepoPrecheckResult {
  url: string;
  role: string;
  label?: string | null;
  accessible: boolean;
  owner?: string | null;
  name?: string | null;
  default_branch?: string | null;
  languages: Record<string, number>;
  commit_count: number;
  distinct_commit_days: number;
  file_count: number;
  has_tests: boolean;
  has_readme: boolean;
  is_fork: boolean;
  error?: string | null;
}

export interface LiveSitePrecheckResult {
  url: string;
  final_url: string;
  reachable: boolean;
  status_code?: number | null;
  title?: string | null;
  detected_tech: string[];
  is_placeholder_or_parked: boolean;
  error?: string | null;
}

export interface SourceAnalysisResponse {
  repos: RepoPrecheckResult[];
  live_site?: LiveSitePrecheckResult | null;
  detected_technologies: string[];
  warnings: string[];
  all_accessible: boolean;
}

export interface InternshipSettings {
  allowed_durations: number[];
  require_demo_video: boolean;
  default_build_days: number;
  review_sla_days: number;
  questions_per_submission: number;
  allow_parallel_enrollments: boolean;
  updated_at: string;
}

// --------------------------------------------------------------------------
// Certificates
// --------------------------------------------------------------------------

export interface TemplateField {
  key:
    | "recipient_name"
    | "project_title"
    | "duration"
    | "issued_on"
    | "certificate_number"
    /** Kept for templates built before projects carried their own title. */
    | "track_title"
    | "custom";
  text?: string | null;
  x: number;
  y: number;
  font_size: number;
  font_weight: "regular" | "bold";
  color: string;
  align: "left" | "center" | "right";
  max_width?: number | null;
}

export interface CertificateTemplate {
  _id: string;
  name: string;
  background_url: string;
  width: number;
  height: number;
  fields: TemplateField[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Certificate {
  _id: string;
  certificate_number: string;
  recipient_name: string;
  user_id: string;
  enrollment_id: string;
  track_title: string;
  issued_at: string;
  pdf_url: string;
  revoked: boolean;
  revoked_reason?: string | null;
}

export interface CertificateVerification {
  certificate_number: string;
  recipient_name: string;
  track_title: string;
  issued_at: string;
  valid: boolean;
  revoked: boolean;
  issuer: string;
}
