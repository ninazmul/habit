import DesktopSidebar from "@/components/navigation/DesktopSidebar";
import BottomNav from "@/components/navigation/BottomNav";
import TopNavbar from "@/components/navigation/TopNavbar";
import AddToHomeScreen from "@/components/shared/AddToHomeScreen";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HabitRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <DesktopSidebar />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-24 md:pb-8">
        <TopNavbar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

      <BottomNav />
      <AddToHomeScreen />
    </div>
  );
}
