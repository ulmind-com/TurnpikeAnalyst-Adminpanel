import { request } from "../client";

export interface TestimonialResponse {
  _id: string;
  quote: string;
  name: string;
  role: string;
}

export interface AwardResponse {
  _id: string;
  title: string;
  body: string;
}

export interface StatResponse {
  _id: string;
  label: string;
  value: string;
  suffix: string;
}

export const listTestimonials = (params: { skip?: number; limit?: number } = {}) =>
  request<TestimonialResponse[]>({ url: "/content/testimonials", method: "GET", params });

export const listAwards = (params: { skip?: number; limit?: number } = {}) =>
  request<AwardResponse[]>({ url: "/content/awards", method: "GET", params });

export const listStats = (params: { skip?: number; limit?: number } = {}) =>
  request<StatResponse[]>({ url: "/content/stats", method: "GET", params });
