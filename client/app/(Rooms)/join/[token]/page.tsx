import { Spinner } from "@/components/ui/spinner";
import { auth } from "@/lib/auth";
import { redirectAfterSignin } from "@/lib/utils/redirectAfterSignin";
import { headers } from "next/headers";
import { Suspense } from "react";
import VerifyJoin from "../../_RoomComponents/VerifyJoin";

export const metadata = {
  title: "Verify Invite",
};

const JoinRoomPage = async ({ params }: { params: { token: string } }) => {
  const { token } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) return redirectAfterSignin(`/join/${token}`); // to redirect back to this route after signin completes
  return (
    <div>
      <Suspense
        fallback={
          <div className="flex w-full items-center justify-center gap-x-2 pt-40">
            Verifying
            <Spinner className="size-6" />
          </div>
        }
      >
        <VerifyJoin token={token} />
      </Suspense>
    </div>
  );
};

export default JoinRoomPage;
