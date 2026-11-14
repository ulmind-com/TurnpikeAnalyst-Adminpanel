import { request } from "@turnpike/shared/api/client";
import type {
  AnswerPayload,
  Attachment,
  EnrollPayload,
  Certificate,
  CertificateTemplate,
  CertificateVerification,
  Enrollment,
  EnrollmentAdmin,
  InternshipSettings,
  InternshipStatus,
  InternshipTrack,
  RepoEntryPayload,
  SourceAnalysisResponse,
  SourceArchive,
  SubmissionPayload,
  TemplateField,
  TrackCreate,
  TrackUpdate,
} from "@turnpike/shared/types/internship";

const BASE = "/internship";

// --------------------------------------------------------------------------
// Public / intern
// --------------------------------------------------------------------------

export const listTracks = (params: { category?: string; limit?: number } = {}) =>
  request<InternshipTrack[]>({ url: `${BASE}/tracks`, method: "GET", params });

export const getTrack = (slug: string) =>
  request<InternshipTrack>({ url: `${BASE}/tracks/${slug}`, method: "GET" });

export const enroll = (payload: EnrollPayload) =>
  request<Enrollment>({ url: `${BASE}/enroll`, method: "POST", data: payload });

/** Upload a diagram image for one enrollment. Served back only to its owner. */
export const uploadAttachment = (enrollmentId: string, file: File) => {
  const body = new FormData();
  body.append("file", file);
  return request<Attachment>({
    url: `${BASE}/me/enrollments/${enrollmentId}/attachments`,
    method: "POST",
    data: body,
  });
};

/** Authenticated URL for a stored diagram. */
export const attachmentUrl = (assetId: string) =>
  `${BASE}/attachments/${assetId}`;

/** Upload the project source as a .zip for one enrollment. Validated as a real
 * zip server-side before it is stored; required before the project can be
 * submitted. A re-upload replaces the previous archive. */
export const uploadSourceArchive = (enrollmentId: string, file: File) => {
  const body = new FormData();
  body.append("file", file);
  return request<SourceArchive>({
    url: `${BASE}/me/enrollments/${enrollmentId}/source-archive`,
    method: "POST",
    data: body,
    timeout: 300_000,
  });
};

/** Pre-submission real-time source and live URL inspection. */
export const analyzeSources = (
  enrollmentId: string,
  payload: { repositories: RepoEntryPayload[]; live_url?: string }
) =>
  request<SourceAnalysisResponse>({
    url: `${BASE}/me/enrollments/${enrollmentId}/analyze-sources`,
    method: "POST",
    data: payload,
  });

/** Download the stored source archive as a Blob. Goes through the API client so
 * the auth header is attached — a plain link cannot, as the route is protected.
 * Serves the owner and admins. */
export const downloadSourceArchive = (enrollmentId: string) =>
  request<Blob>({
    url: `${BASE}/me/enrollments/${enrollmentId}/source-archive`,
    method: "GET",
    responseType: "blob",
  });

export const listMyEnrollments = () =>
  request<Enrollment[]>({ url: `${BASE}/me/enrollments`, method: "GET" });

export const getMyEnrollment = (id: string) =>
  request<Enrollment>({ url: `${BASE}/me/enrollments/${id}`, method: "GET" });

export const submitProject = (id: string, payload: SubmissionPayload) =>
  request<Enrollment>({ url: `${BASE}/me/enrollments/${id}/submit`, method: "POST", data: payload });

export const submitAnswers = (id: string, payload: AnswerPayload) =>
  request<Enrollment>({ url: `${BASE}/me/enrollments/${id}/answers`, method: "POST", data: payload });

export const listMyCertificates = () =>
  request<Certificate[]>({ url: `${BASE}/me/certificates`, method: "GET" });

/** Unauthenticated: anyone holding a certificate number can check it. */
export const verifyCertificate = (certificateNumber: string) =>
  request<CertificateVerification>({
    url: `${BASE}/certificates/verify/${encodeURIComponent(certificateNumber)}`,
    method: "GET",
  });

// --------------------------------------------------------------------------
// Admin
// --------------------------------------------------------------------------

const ADMIN = `${BASE}/admin`;

export const adminGetSettings = () =>
  request<InternshipSettings>({ url: `${ADMIN}/settings`, method: "GET" });

export const adminUpdateSettings = (payload: Partial<InternshipSettings>) =>
  request<InternshipSettings>({ url: `${ADMIN}/settings`, method: "PATCH", data: payload });

export const adminListTracks = () =>
  request<InternshipTrack[]>({ url: `${ADMIN}/tracks`, method: "GET" });

export const adminCreateTrack = (payload: TrackCreate) =>
  request<InternshipTrack>({ url: `${ADMIN}/tracks`, method: "POST", data: payload });

export const adminUpdateTrack = (id: string, payload: TrackUpdate) =>
  request<InternshipTrack>({ url: `${ADMIN}/tracks/${id}`, method: "PUT", data: payload });

export const adminDeleteTrack = (id: string) =>
  request<void>({ url: `${ADMIN}/tracks/${id}`, method: "DELETE" });

export const adminDeleteSourceArchive = (enrollmentId: string) =>
  request<EnrollmentAdmin>({
    url: `${ADMIN}/submissions/${enrollmentId}/source-archive`,
    method: "DELETE",
  });

export const adminListSubmissions = (status?: InternshipStatus) =>
  request<EnrollmentAdmin[]>({
    url: `${ADMIN}/submissions`,
    method: "GET",
    params: status ? { status } : undefined,
  });

export const adminGetSubmission = (id: string) =>
  request<EnrollmentAdmin>({ url: `${ADMIN}/submissions/${id}`, method: "GET" });

export const adminDecide = (
  id: string,
  approved: boolean,
  notes?: string,
  demoVerified = false,
) =>
  request<EnrollmentAdmin>({
    url: `${ADMIN}/submissions/${id}/decision`,
    method: "POST",
    data: { approved, notes, demo_verified: demoVerified },
  });

export const adminListTemplates = () =>
  request<CertificateTemplate[]>({ url: `${ADMIN}/certificate-templates`, method: "GET" });

/** Uploads the artwork and returns its stored URL plus measured dimensions. */
export const adminUploadBackground = (file: File) => {
  const body = new FormData();
  body.append("file", file);
  return request<{ background_url: string; width: number; height: number }>({
    url: `${ADMIN}/certificate-templates/background`,
    method: "POST",
    data: body,
  });
};

export const adminCreateTemplate = (payload: {
  name: string;
  background_url: string;
  width: number;
  height: number;
  fields: TemplateField[];
  is_active: boolean;
}) =>
  request<CertificateTemplate>({
    url: `${ADMIN}/certificate-templates`,
    method: "POST",
    data: payload,
  });

export const adminUpdateTemplate = (
  id: string,
  payload: Partial<{
    name: string;
    background_url: string;
    width: number;
    height: number;
    fields: TemplateField[];
    is_active: boolean;
  }>,
) =>
  request<CertificateTemplate>({
    url: `${ADMIN}/certificate-templates/${id}`,
    method: "PUT",
    data: payload,
  });

export const adminDeleteTemplate = (id: string) =>
  request<void>({ url: `${ADMIN}/certificate-templates/${id}`, method: "DELETE" });

export const adminPreviewTemplate = (id: string) =>
  request<{ preview_url: string }>({
    url: `${ADMIN}/certificate-templates/${id}/preview`,
    method: "POST",
  });

export const adminListCertificates = () =>
  request<Certificate[]>({ url: `${ADMIN}/certificates`, method: "GET" });

export const adminRevokeCertificate = (id: string, reason: string) =>
  request<Certificate>({
    url: `${ADMIN}/certificates/${id}/revoke`,
    method: "POST",
    params: { reason },
  });
