/**
 * Habit by Rizmec — Global Constants & Application Configuration
 * Personal Command Center
 */

export const APP_CONFIG = {
  name: "Habit",
  brand: "Habit by Rizmec",
  version: "v1.0.0",
  versionRaw: "1.0.0",
  tagline: "Personal Command Center",
  subTagline: "Command every aspect of your personal & professional life",
  description:
    "Habit is your personal command center — manage daily tasks, AI accounts & rotation, projects, milestones, finances, shopping, events, and a secure encrypted vault.",
  author: {
    name: "Rizmec",
    url: "https://rizmec.com",
  },
  links: {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://habit.rizmec.com",
    authorUrl: "https://rizmec.com",
  },
  assets: {
    logo: "/assets/images/logo.png",
    logoAlt: "Habit Logo — Personal Command Center",
    favicon192: "/assets/icons/icon-192.png",
    favicon512: "/assets/icons/icon-512.png",
    appleTouchIcon: "/assets/icons/apple-touch-icon.png",
  },
  currency: {
    symbol: "৳",
    code: "BDT",
    name: "Bangladeshi Taka",
  },
} as const;

export const APP_NAME = APP_CONFIG.name;
export const APP_BRAND = APP_CONFIG.brand;
export const APP_VERSION = APP_CONFIG.version;
export const APP_VERSION_RAW = APP_CONFIG.versionRaw;
export const APP_TAGLINE = APP_CONFIG.tagline;
export const APP_SUBTAGLINE = APP_CONFIG.subTagline;
export const APP_DESCRIPTION = APP_CONFIG.description;
export const APP_AUTHOR = APP_CONFIG.author.name;
export const APP_AUTHOR_URL = APP_CONFIG.author.url;
export const APP_SITE_URL = APP_CONFIG.links.siteUrl;
export const APP_LOGO = APP_CONFIG.assets.logo;
export const APP_LOGO_ALT = APP_CONFIG.assets.logoAlt;
export const CURRENCY_SYMBOL = APP_CONFIG.currency.symbol;
