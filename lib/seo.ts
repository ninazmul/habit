import type { Metadata } from "next";
import { APP_NAME, APP_BRAND, APP_SITE_URL, APP_TAGLINE, APP_DESCRIPTION } from "@/lib/constants";

export const SITE_URL = (
  APP_SITE_URL || "https://habit.rizmec.com"
).replace(/\/$/, "");

export const SITE_NAME = APP_NAME;

export const SEO_KEYWORDS = [
  "Habit",
  "Habit by Rizmec",
  "Personal Command Center",
  "habit.rizmec.com",
  "Daily Tasks",
  "AI Account Manager",
  "AI Rotation & Cooldown",
  "Project Management",
  "Project Milestones",
  "Income Tracker",
  "Personal Finance",
  "Expense Tracker",
  "Encrypted Vault",
  "Mobile PWA",
  "Productivity OS",
];

export const publicSeoPages = [
  {
    path: "/sign-in",
    title: `${APP_BRAND} — ${APP_TAGLINE}`,
    description: APP_DESCRIPTION,
    priority: 1,
  },
  {
    path: "/sign-up",
    title: `Sign Up | ${APP_BRAND}`,
    description: APP_DESCRIPTION,
    priority: 0.8,
  },
] as const;

export function buildPublicPageMetadata(
  path: (typeof publicSeoPages)[number]["path"],
): Metadata {
  const page = publicSeoPages.find((item) => item.path === path);

  if (!page) {
    return {
      title: `${APP_BRAND} — ${APP_TAGLINE}`,
      description: APP_DESCRIPTION,
    };
  }

  return {
    title: page.title,
    description: page.description,
    keywords: SEO_KEYWORDS,
    alternates: {
      canonical: path,
    },
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      type: "website",
      url: `${SITE_URL}${path}`,
      siteName: SITE_NAME,
      title: page.title,
      description: page.description,
      images: [
        {
          url: "/assets/images/logo.png",
          width: 512,
          height: 512,
          alt: `${APP_BRAND} — ${APP_TAGLINE}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: ["/assets/images/logo.png"],
    },
  };
}
