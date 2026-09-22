import type { MetadataRoute } from "next";
import { APP_NAME, APP_BRAND, APP_TAGLINE, APP_DESCRIPTION } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_BRAND} — ${APP_TAGLINE}`,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#09090b",
    theme_color: "#09090b",
    categories: ["productivity", "business", "utilities", "finance"],
    prefer_related_applications: false,
    shortcuts: [
      {
        name: "Tasks",
        short_name: "Tasks",
        description: "View and manage your tasks",
        url: "/tasks",
        icons: [
          {
            src: "/assets/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "AI Accounts",
        short_name: "AI Accounts",
        description: "View AI rotation and cooldowns",
        url: "/ai-accounts",
        icons: [
          {
            src: "/assets/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "Projects",
        short_name: "Projects",
        description: "View projects and milestones",
        url: "/projects",
        icons: [
          {
            src: "/assets/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "Finance",
        short_name: "Finance",
        description: "Income, expenses and investments",
        url: "/finance",
        icons: [
          {
            src: "/assets/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    ],
    icons: [
      {
        src: "/assets/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/assets/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/assets/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [
      {
        src: "/assets/images/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
