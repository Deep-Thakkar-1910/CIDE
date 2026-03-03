"use client";
import axios from "@/lib/axios";
import { StatusCodes } from "@/lib/constants/StatusCodes";
import { AxiosError } from "axios";
import { redirect, RedirectType } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { useQuery } from "@tanstack/react-query";

interface RoomPageComponentProps {
  roomId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

const fetchAuth = async (roomId: string) => {
  try {
    const result = await axios.get(`/room/auth/${roomId}`, {
      withCredentials: true,
    });
    return result.data;
  } catch (err) {
    if (err instanceof AxiosError) {
      console.error("Error in room page: ", err.response);
      if (err.response?.status === StatusCodes.FORBIDDEN) {
        toast.error(`${err.response.data.error}`, {
          description:
            "Please ask the owner of the room to send an invite link.",
        });
        return redirect("/", RedirectType.replace);
      }
    }
  }
};

const RoomPageComponent = ({ roomId, user }: RoomPageComponentProps) => {
  const { isLoading } = useQuery({
    queryKey: ["roomAuth", roomId],
    queryFn: () => fetchAuth(roomId as unknown as string),
  });

  return (
    <>
      <div className="flex min-h-screen w-full items-center justify-center">
        {isLoading ? <Spinner /> : `${user.name} ${roomId}`}
      </div>
    </>
  );
};

export default RoomPageComponent;
