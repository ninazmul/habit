import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { Toaster } from "react-hot-toast";
import { SEO_KEYWORDS, SITE_URL } from "@/lib/seo";
import {
  APP_NAME,
  APP_BRAND,
  APP_TAGLINE,
  APP_DESCRIPTION,
  APP_AUTHOR,
  APP_LOGO,
} from "@/lib/constants";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${APP_BRAND} — ${APP_TAGLINE}`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: SEO_KEYWORDS,
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: APP_NAME,
    title: `${APP_BRAND} — ${APP_TAGLINE}`,
    description: APP_DESCRIPTION,
    url: SITE_URL,
    images: [
      {
        url: APP_LOGO,
        width: 512,
        height: 512,
        alt: `${APP_BRAND} — ${APP_TAGLINE}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_BRAND} — ${APP_TAGLINE}`,
    description: APP_DESCRIPTION,
    images: [APP_LOGO],
  },
  icons: {
    icon: [
      { url: "/assets/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/assets/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
    startupImage: ["/assets/icons/apple-touch-icon.png"],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  applicationName: APP_NAME,
  authors: [{ name: APP_AUTHOR }],
  creator: APP_AUTHOR,
  publisher: APP_AUTHOR,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${inter.variable} font-sans antialiased bg-background text-foreground min-h-screen`}
          suppressHydrationWarning
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3500,
                style: {
                  background: "hsl(var(--card))",
                  color: "hsl(var(--card-foreground))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "14px",
                  boxShadow: "0 10px 30px -10px rgba(0,0,0,0.3)",
                },
              }}
            />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
