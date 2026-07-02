/** The curated sector grid (brief §11) + slug helpers for URL state. */

export const SECTORS = [
  "Banking & Credit Unions",
  "Healthcare & Hospitals",
  "Pharma & Biotech",
  "Government & Public Sector",
  "Education & Universities",
  "Energy & Utilities",
  "Logistics & Supply Chain",
  "Manufacturing",
  "Insurance",
  "Legal Services",
  "Retail & E-commerce",
  "Telecommunications",
  "Media & Publishing",
  "Agriculture & Food",
  "Defense & Aerospace",
  "Professional Services",
] as const;

export const OTHER_PLACEHOLDER =
  "Describe your organization — e.g. 'regional water utility', 'independent bookshop chain', 'maritime insurer'…";

export function toSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function fromSlug(slug: string): string {
  const listed = SECTORS.find((s) => toSlug(s) === slug);
  return listed ?? slug.replace(/-/g, " ");
}
