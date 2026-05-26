import type { Coalition, Organization } from "./types";

export function initials(name: string, maxChars = 3): string {
  const cleaned = name.replace(/\(.*?\)/g, " ").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, maxChars).toUpperCase();
  }
  return parts
    .slice(0, maxChars)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function relTime(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = now - t;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  const y = Math.floor(mo / 12);
  return `${y}y ago`;
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function coalitionRadius(c: Coalition): number {
  // sqrt scaling so big coalitions don't blot out the canvas
  return 26 + Math.sqrt(c.member_count) * 7;
}

export function orgRadius(_o: Organization): number {
  return 14;
}

export function typeLabel(t: string): string {
  const map: Record<string, string> = {
    "501c3": "501(c)(3)",
    "501c4": "501(c)(4)",
    school_club: "School Club",
    youth_org: "Youth Org",
    faith_org: "Faith Org",
    union: "Union",
    municipal: "Municipal",
    professional: "Professional Assoc",
    volunteer: "Volunteer Group",
    media: "Media",
    regional_gov: "Regional Gov't",
    business: "Business",
    university: "University",
    unknown: "Unknown",
  };
  return map[t] || t;
}
