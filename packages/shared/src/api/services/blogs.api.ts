import { request } from "@turnpike/shared/api/client";
import type { BlogCategory, BlogCreate, BlogResponse, PageParams } from "@turnpike/shared/types/api";

export interface BlogListParams extends PageParams {
  category?: BlogCategory;
  tag?: string;
}

export const listBlogs = (params: BlogListParams = {}) =>
  request<BlogResponse[]>({ url: "/blogs/", method: "GET", params });

export const getBlog = (slug: string) =>
  request<BlogResponse>({ url: `/blogs/${slug}`, method: "GET" });

export const createBlog = (payload: BlogCreate) =>
  request<BlogResponse>({ url: "/blogs/", method: "POST", data: payload });
