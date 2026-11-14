import { request } from "@turnpike/shared/api/client";
import type {
  ApplicationStatus,
  CourseCategory,
  CourseLevel,
  CourseResponse,
  InstructorApplicationResponse,
  PageParams,
} from "@turnpike/shared/types/api";

export interface CourseListParams extends PageParams {
  category?: CourseCategory;
  level?: CourseLevel;
}

export const listCourses = (params: CourseListParams = {}) =>
  request<CourseResponse[]>({ url: "/training/courses", method: "GET", params });

export const getCourse = (slug: string) =>
  request<CourseResponse>({ url: `/training/courses/${slug}`, method: "GET" });

export interface InstructorApplicationParams extends PageParams {
  status?: ApplicationStatus;
}

export const listInstructorApplications = (params: InstructorApplicationParams = {}) =>
  request<InstructorApplicationResponse[]>({
    url: "/training/instructor-applications",
    method: "GET",
    params,
  });

export const becomeInstructor = (payload: Record<string, unknown>) =>
  request({ url: "/training/become-instructor", method: "POST", data: payload });

export const createCourse = (data: Partial<CourseResponse>) =>
  request<CourseResponse>({ url: "/training/courses", method: "POST", data });

export const updateCourse = (slug: string, data: Partial<CourseResponse>) =>
  request<CourseResponse>({ url: `/training/courses/${slug}`, method: "PUT", data });

export const deleteCourse = (slug: string) =>
  request<void>({ url: `/training/courses/${slug}`, method: "DELETE" });

