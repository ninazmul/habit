import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/cron(.*)",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/~offline",
]);

const handler = clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

// Next.js 16 renamed "middleware" to "proxy"
export const proxy = handler;

export const config = {
  matcher: [
    "/",
    "/((?!_next|api/cron|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api(?!/cron)|trpc)(.*)",
  ],
};
