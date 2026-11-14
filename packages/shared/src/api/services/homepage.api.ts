import { apiClient, request } from "../client";

export interface CTA {
  label: string;
  href: string;
}

export interface HeroTile {
  tag: string;
  type: "solid" | "photo";
  bg?: string | null;
  img?: string | null;
}

export interface HeroSection {
  badge: string;
  title_lines: string[];
  highlight_word: string;
  title_suffix: string;
  subtitle: string;
  primary_cta: CTA;
  secondary_cta: CTA;
  tiles: HeroTile[];
}

export interface HeroClaim {
  title: string;
  body: string;
}

export interface PlatformStats {
  service_label: string;
  product_label: string;
  product_value: number;
  course_label: string;
}

export interface TechStackGroup {
  category: string;
  items: string[];
}

export interface SectionHeading {
  eyebrow: string;
  title: string;
  description: string;
}

export interface Capability {
  icon: string;
  title: string;
  body: string;
}

export interface FlagshipBullet {
  title: string;
  body: string;
}

export interface Flagship {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  bullets: FlagshipBullet[];
  cta: string;
}

export interface WhyChooseItem {
  title: string;
  body: string;
}

export interface Counter {
  label: string;
  value: number;
  suffix: string;
}

export interface HomepageContent {
  hero: HeroSection;
  hero_claims: HeroClaim[];
  platform_stats: PlatformStats;
  tech_heading: SectionHeading;
  tech_stack: TechStackGroup[];
  services_heading: SectionHeading;
  industries_heading: SectionHeading;
  flagships: Flagship[];
  capabilities: Capability[];
  why_heading: SectionHeading;
  why_choose: WhyChooseItem[];
  why_cta_label: string;
  counters: Counter[];
  awards_heading: SectionHeading;
  reviews_heading: SectionHeading;
  insights_heading: SectionHeading;
}

/** Public: full editable homepage content. */
export const getHomepage = () =>
  request<HomepageContent>({ url: "/content/homepage", method: "GET" });

/** Admin: replace the homepage content document. */
export const updateHomepage = (data: HomepageContent) =>
  request<HomepageContent>({ url: "/content/homepage", method: "PUT", data });

/** Admin: upload a homepage image; returns its hosted URL. */
export async function uploadHomepageImage(file: File): Promise<{ url: string; key: string }> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<{ url: string; key: string }>(
    "/content/homepage/upload-image",
    form,
  );
  return data;
}
