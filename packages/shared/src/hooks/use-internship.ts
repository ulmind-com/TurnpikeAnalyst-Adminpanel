import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as api from "@turnpike/shared/api/services/internship.api";
import type {
  AnswerPayload,
  EnrollPayload,
  InternshipStatus,
  RepoEntryPayload,
  SubmissionPayload,
} from "@turnpike/shared/types/internship";

/** Statuses where the backend is still working and the page should re-poll. */
const IN_FLIGHT: InternshipStatus[] = ["AI_REVIEWING"];

export const internshipKeys = {
  tracks: ["internship", "tracks"] as const,
  track: (slug: string) => ["internship", "track", slug] as const,
  myEnrollments: ["internship", "me", "enrollments"] as const,
  myEnrollment: (id: string) => ["internship", "me", "enrollment", id] as const,
  myCertificates: ["internship", "me", "certificates"] as const,
  adminTracks: ["internship", "admin", "tracks"] as const,
  adminSubmissions: (status?: string) =>
    ["internship", "admin", "submissions", status ?? "all"] as const,
  adminSubmission: (id: string) => ["internship", "admin", "submission", id] as const,
  adminTemplates: ["internship", "admin", "templates"] as const,
  adminCertificates: ["internship", "admin", "certificates"] as const,
  adminSettings: ["internship", "admin", "settings"] as const,
};

// --------------------------------------------------------------------------
// Intern
// --------------------------------------------------------------------------

export const useTracks = (category?: string) =>
  useQuery({
    queryKey: [...internshipKeys.tracks, category ?? "all"],
    queryFn: () => api.listTracks(category ? { category } : {}),
  });

export const useTrack = (slug: string) =>
  useQuery({
    queryKey: internshipKeys.track(slug),
    queryFn: () => api.getTrack(slug),
    enabled: Boolean(slug),
  });

export const useMyEnrollments = (enabled = true) =>
  useQuery({
    queryKey: internshipKeys.myEnrollments,
    queryFn: api.listMyEnrollments,
    enabled,
  });

export const useMyEnrollment = (id: string, enabled = true) =>
  useQuery({
    queryKey: internshipKeys.myEnrollment(id),
    queryFn: () => api.getMyEnrollment(id),
    enabled: enabled && Boolean(id),
    // The automated review runs detached from the request, so the page polls
    // while it is in flight and stops as soon as a terminal state lands.
    refetchInterval: (query) =>
      query.state.data && IN_FLIGHT.includes(query.state.data.status) ? 4000 : false,
  });

export const useEnroll = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EnrollPayload) => api.enroll(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: internshipKeys.myEnrollments });
    },
  });
};

export const useAnalyzeSources = (enrollmentId: string) => {
  return useMutation({
    mutationFn: (payload: { repositories: RepoEntryPayload[]; live_url?: string }) =>
      api.analyzeSources(enrollmentId, payload),
  });
};

export const useSubmitProject = (enrollmentId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmissionPayload) => api.submitProject(enrollmentId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(internshipKeys.myEnrollment(enrollmentId), data);
      void queryClient.invalidateQueries({ queryKey: internshipKeys.myEnrollments });
    },
  });
};

export const useSubmitAnswers = (enrollmentId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AnswerPayload) => api.submitAnswers(enrollmentId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(internshipKeys.myEnrollment(enrollmentId), data);
      void queryClient.invalidateQueries({ queryKey: internshipKeys.myEnrollments });
    },
  });
};

export const useMyCertificates = (enabled = true) =>
  useQuery({
    queryKey: internshipKeys.myCertificates,
    queryFn: api.listMyCertificates,
    enabled,
  });

export const useVerifyCertificate = (certificateNumber: string) =>
  useQuery({
    queryKey: ["internship", "verify", certificateNumber],
    queryFn: () => api.verifyCertificate(certificateNumber),
    enabled: Boolean(certificateNumber),
    retry: false,
  });

// --------------------------------------------------------------------------
// Admin
// --------------------------------------------------------------------------

export const useAdminTracks = () =>
  useQuery({ queryKey: internshipKeys.adminTracks, queryFn: api.adminListTracks });

export const useAdminSubmissions = (status?: InternshipStatus) =>
  useQuery({
    queryKey: internshipKeys.adminSubmissions(status),
    queryFn: () => api.adminListSubmissions(status),
  });

export const useAdminSubmission = (id: string) =>
  useQuery({
    queryKey: internshipKeys.adminSubmission(id),
    queryFn: () => api.adminGetSubmission(id),
    enabled: Boolean(id),
  });

export const useAdminDecide = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      approved,
      notes,
      demoVerified,
    }: {
      id: string;
      approved: boolean;
      notes?: string;
      demoVerified?: boolean;
    }) => api.adminDecide(id, approved, notes, demoVerified),
    onSuccess: (data) => {
      queryClient.setQueryData(internshipKeys.adminSubmission(data._id), data);
      void queryClient.invalidateQueries({ queryKey: ["internship", "admin", "submissions"] });
      void queryClient.invalidateQueries({ queryKey: internshipKeys.adminCertificates });
    },
  });
};

export const useAdminDeleteSourceArchive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enrollmentId: string) => api.adminDeleteSourceArchive(enrollmentId),
    onSuccess: (data) => {
      queryClient.setQueryData(internshipKeys.adminSubmission(data._id), data);
      void queryClient.invalidateQueries({ queryKey: ["internship", "admin", "submissions"] });
    },
  });
};

export const useAdminTemplates = () =>
  useQuery({ queryKey: internshipKeys.adminTemplates, queryFn: api.adminListTemplates });

export const useAdminCertificates = () =>
  useQuery({ queryKey: internshipKeys.adminCertificates, queryFn: api.adminListCertificates });

export const useAdminSettings = () =>
  useQuery({ queryKey: internshipKeys.adminSettings, queryFn: api.adminGetSettings });
