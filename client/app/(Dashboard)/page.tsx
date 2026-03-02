import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import DashboardPage from "./_components/Dashboard/DashboardSection";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your dashboard to manage your projects.",
};

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) redirect("/signin");
  return (
    <div className="bg-background flex items-center justify-center font-sans">
      {/* Dashboard Page*/}
      <DashboardPage />
    </div>
  );
}
