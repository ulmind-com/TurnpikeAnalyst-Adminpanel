import { useMutation, useQuery } from "@tanstack/react-query";

import { getBlog, listBlogs } from "@turnpike/shared/api/services/blogs.api";
import { bookCall, submitNeeds } from "@turnpike/shared/api/services/leads.api";
import { subscribe } from "@turnpike/shared/api/services/newsletter.api";

import { getService, listServices } from "@turnpike/shared/api/services/services.api";
import { getIndustry, listIndustries } from "@turnpike/shared/api/services/industries.api";
import { getCourse, listCourses } from "@turnpike/shared/api/services/training.api";
import { listTestimonials, listAwards, listStats } from "@turnpike/shared/api/services/content.api";
import { getHomepage } from "@turnpike/shared/api/services/homepage.api";

export const usePublicServices = () =>
  useQuery({ queryKey: ["public", "services"], queryFn: () => listServices({ limit: 24 }) });

export const usePublicIndustries = () =>
  useQuery({ queryKey: ["public", "industries"], queryFn: () => listIndustries({ limit: 24 }) });


export const usePublicCourses = () =>
  useQuery({ queryKey: ["public", "courses"], queryFn: () => listCourses({ limit: 12 }) });

export const usePublicBlogs = () =>
  useQuery({ queryKey: ["public", "blogs"], queryFn: () => listBlogs({ limit: 100 }) });

export const usePublicService = (slug: string) =>
  useQuery({ queryKey: ["public", "service", slug], queryFn: () => getService(slug), enabled: !!slug, retry: false });

export const usePublicIndustry = (slug: string) =>
  useQuery({ queryKey: ["public", "industry", slug], queryFn: () => getIndustry(slug), enabled: !!slug, retry: false });

export const usePublicCourse = (slug: string) =>
  useQuery({ queryKey: ["public", "course", slug], queryFn: () => getCourse(slug), enabled: !!slug, retry: false });

export const usePublicBlog = (slug: string) =>
  useQuery({ queryKey: ["public", "blog", slug], queryFn: () => getBlog(slug), enabled: !!slug, retry: false });

export const useBookCall = () =>
  useMutation({ mutationFn: (payload: Record<string, unknown>) => bookCall(payload) });

export const useSubmitNeeds = () =>
  useMutation({ mutationFn: (payload: Record<string, unknown>) => submitNeeds(payload) });


export const useSubscribe = () =>
  useMutation({ mutationFn: (email: string) => subscribe(email) });

export const usePublicTestimonials = () =>
  useQuery({ queryKey: ["public", "testimonials"], queryFn: () => listTestimonials() });

export const usePublicAwards = () =>
  useQuery({ queryKey: ["public", "awards"], queryFn: () => listAwards() });

export const usePublicStats = () =>
  useQuery({ queryKey: ["public", "stats"], queryFn: () => listStats() });

export const usePublicHomepage = () =>
  useQuery({
    queryKey: ["public", "homepage"],
    queryFn: () => getHomepage(),
    staleTime: 5 * 60_000,
  });
