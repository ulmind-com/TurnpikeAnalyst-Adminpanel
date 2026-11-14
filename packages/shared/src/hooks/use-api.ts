import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ApiErrorShape } from "@turnpike/shared/api/client";
import { listBlogs, createBlog, type BlogListParams } from "@turnpike/shared/api/services/blogs.api";
import { listLeads, updateLeadStatus, submitSupportTicket, type LeadListParams } from "@turnpike/shared/api/services/leads.api";
import { listSubscribers } from "@turnpike/shared/api/services/newsletter.api";

import { listUsers, createUser, updateUser, deleteUser } from "@turnpike/shared/api/services/users.api";
import { listActivityLogs } from "@turnpike/shared/api/services/activity.api";
import { listAssets } from "@turnpike/shared/api/services/cms.api";
import {
  getHomepage,
  updateHomepage,
  type HomepageContent,
} from "@turnpike/shared/api/services/homepage.api";
import {
  createService,
  deleteService,
  listServices,
  updateService,
  type ServiceListParams,
} from "@turnpike/shared/api/services/services.api";
import {
  createIndustry,
  deleteIndustry,
  listIndustries,
  updateIndustry,
  type IndustryListParams,
} from "@turnpike/shared/api/services/industries.api";
import {
  listCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  listInstructorApplications,
  type CourseListParams,
  type InstructorApplicationParams,
} from "@turnpike/shared/api/services/training.api";
import { queryKeys } from "@turnpike/shared/constants/query-keys";
import type {
  BlogCreate,
  LeadResponse,
  LeadStatus,
  PageParams,
  ServiceCreate,
  ServiceUpdate,
  IndustryCreate,
  IndustryUpdate,
} from "@turnpike/shared/types/api";

const onError = (error: unknown) => {
  const err = error as ApiErrorShape;
  toast.error(err?.message ?? "Something went wrong");
};

/* ---------------------------------- reads --------------------------------- */

export const useServices = (params: ServiceListParams = {}) =>
  useQuery({ queryKey: queryKeys.services(params), queryFn: () => listServices(params) });


export const useLeads = (params: LeadListParams = {}) =>
  useQuery({ queryKey: queryKeys.leads(params), queryFn: () => listLeads(params) });

export const useSubmitSupportTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitSupportTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
};


export const useCourses = (params: CourseListParams = {}) =>
  useQuery({ queryKey: queryKeys.courses(params), queryFn: () => listCourses(params) });

export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses({}) });
      toast.success("Course created successfully");
    },
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: any }) =>
      updateCourse(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses({}) });
      toast.success("Course updated successfully");
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses({}) });
      toast.success("Course deleted successfully");
    },
  });
};

export const useInstructorApplications = (params: InstructorApplicationParams = {}) =>
  useQuery({
    queryKey: queryKeys.instructorApplications(params),
    queryFn: () => listInstructorApplications(params),
  });

export const useBlogs = (params: BlogListParams = {}) =>
  useQuery({ queryKey: queryKeys.blogs(params), queryFn: () => listBlogs(params) });

export const useSubscribers = (params: PageParams = {}) =>
  useQuery({ queryKey: queryKeys.subscribers(params), queryFn: () => listSubscribers(params) });

export const useUsers = (params: PageParams = {}) =>
  useQuery({ queryKey: queryKeys.users(params), queryFn: () => listUsers(params) });

export const useActivityLogs = (params: PageParams = {}) =>
  useQuery({ queryKey: queryKeys.activityLogs(params), queryFn: () => listActivityLogs(params) });

export const useAssets = (params: PageParams = {}) =>
  useQuery({ queryKey: queryKeys.assets(params), queryFn: () => listAssets(params) });

/* -------------------------------- mutations ------------------------------- */

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ServiceCreate) => createService(payload),
    onSuccess: () => {
      toast.success("Service created");
      void qc.invalidateQueries({ queryKey: ["services"] });
    },
    onError,
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ServiceUpdate }) =>
      updateService(id, payload),
    onSuccess: () => {
      toast.success("Service updated");
      void qc.invalidateQueries({ queryKey: ["services"] });
    },
    onError,
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      toast.success("Service deleted");
      void qc.invalidateQueries({ queryKey: ["services"] });
    },
    onError,
  });
}

export function useIndustries(params?: IndustryListParams) {
  return useQuery({
    queryKey: ["industries", params],
    queryFn: () => listIndustries(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateIndustry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: IndustryCreate) => createIndustry(payload),
    onSuccess: () => {
      toast.success("Industry created");
      void qc.invalidateQueries({ queryKey: ["industries"] });
    },
    onError,
  });
}

export function useUpdateIndustry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: IndustryUpdate }) => updateIndustry(id, payload),
    onSuccess: () => {
      toast.success("Industry updated");
      void qc.invalidateQueries({ queryKey: ["industries"] });
    },
    onError,
  });
}

export function useDeleteIndustry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteIndustry(id),
    onSuccess: () => {
      toast.success("Industry deleted");
      void qc.invalidateQueries({ queryKey: ["industries"] });
    },
    onError,
  });
}

export function useUpdateLeadStatus(params: LeadListParams) {
  const qc = useQueryClient();
  const key = queryKeys.leads(params);

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) => updateLeadStatus(id, status),
    // Optimistic update for instant pipeline feedback.
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<LeadResponse[]>(key);
      qc.setQueryData<LeadResponse[]>(key, (old) =>
        old?.map((lead) => (lead._id === id ? { ...lead, status } : lead)),
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
      onError(error);
    },
    onSuccess: () => toast.success("Lead status updated"),
    onSettled: () => void qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useCreateBlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BlogCreate) => createBlog(payload),
    onSuccess: () => {
      toast.success("Article published");
      void qc.invalidateQueries({ queryKey: ["blogs"] });
    },
    onError,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success("User created successfully");
      void qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError,
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateUser(id, payload),
    onSuccess: () => {
      toast.success("User updated successfully");
      void qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError,
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success("User deleted successfully");
      void qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError,
  });
}

/* ───────────────────────── Homepage CMS ───────────────────────── */

export function useHomepage() {
  return useQuery({ queryKey: ["admin", "homepage"], queryFn: () => getHomepage() });
}

export function useUpdateHomepage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: HomepageContent) => updateHomepage(data),
    onSuccess: () => {
      toast.success("Homepage saved");
      void qc.invalidateQueries({ queryKey: ["admin", "homepage"] });
      void qc.invalidateQueries({ queryKey: ["public", "homepage"] });
    },
    onError,
  });
}
