import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) redirect("/signin");
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans text-4xl dark:bg-black">
      {session.user.name}
    </div>
  );
}
