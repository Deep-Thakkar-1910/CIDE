import axios from "@/lib/axios";
import { AxiosError } from "axios";
import { redirect, RedirectType } from "next/navigation";
import { cookies } from "next/headers";
const VerifyJoin = async ({ token }: { token: string }) => {
  let result;
  const cookieStore = await cookies();
  try {
    result = await axios.post(
      "/verifyinvite",
      { token },
      {
        headers: {
          Cookie: cookieStore.toString(),
        },
      },
    ); // call the API route to verify the token and add the user to the room
  } catch (err) {
    if (err instanceof AxiosError) {
      console.error(
        "Error verifying room token :",
        err.response?.data.error || err.message,
      );
      if (err.response?.data.error === "User is already a member") {
        return redirect(
          `/room/${err.response?.data.roomId}`,
          RedirectType.replace,
        ); // redirect to the room if the user is already a member
      }
    }
    return redirect("/", RedirectType.replace); // redirect to home page on error
  }

  return redirect(`/room/${result?.data?.roomId}`, RedirectType.replace); // redirect to the room after successful verification
  return null;
};

export default VerifyJoin;
