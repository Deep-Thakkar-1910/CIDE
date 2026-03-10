"use client";

import axios from "@/lib/axios";
import { StatusCodes } from "@/lib/constants/StatusCodes";
import { AxiosError } from "axios";
import { redirect, RedirectType } from "next/navigation";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import RoomNavbar from "./RoomNavbar";
import { Room, RoomMember } from "@/generated/prisma/client";
import RoomLoadingComponent from "./RoomLoadingComponent";
import { MessageCircle, ServerCog, TerminalIcon, Users } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/useChat";
import { useTerminal } from "@/hooks/useTerminal";
import { usePresence } from "@/hooks/usePresence";
import ChatSidebar from "./ChatSidebar";
import RoomMemberPresence from "./RoomChat/RoomChatMemberPresence";
import { useEffect, useState } from "react";
import { ChatSocketManager } from "@/lib/chatSocketManager";
import { RoomShareDialog } from "@/app/(Dashboard)/_components/Room/RoomShareDialog";
import dynamic from "next/dynamic";

const CodeEditorLayout = dynamic(
  () => import("./CodeEditor").then((mod) => mod.CodeEditorLayout),
  { ssr: false },
); // We don't want this to be rendered on server first because of the browser editor runtime
type AuthData = RoomMember & {
  roomName: string;
  token: string;
  room: Room;
  user: {
    id: string;
    name: string;
    image?: string;
  };
};

interface RoomPageComponentProps {
  roomId: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

const handleSaveEvent = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "s") {
    event.preventDefault();
  }
};

const fetchAuth = async (roomId: string) => {
  try {
    const result = await axios.get(`/room/auth/${roomId}`, {
      withCredentials: true,
    });

    if (result.data.success) {
      return result.data.data as AuthData;
    }
  } catch (err) {
    if (err instanceof AxiosError) {
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
  const [isRoomModalOpen, setIsRoomModalOpen] = useState<boolean>(false);
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["roomAuth", roomId],
    queryFn: () => fetchAuth(roomId),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });

  // initialize websocket connection and setSocket in chat store.
  const setSocket = useChat((state) => state.setSocket);
  const closeChat = useChat((state) => state.closeChat);
  useEffect(() => {
    if (isLoading || isFetching || !data?.token) return;
    window.addEventListener("keydown", handleSaveEvent);
    const chatSocket = new ChatSocketManager();
    const chatSocketConnection = chatSocket.connect(data.roomId, data.token);
    setSocket(chatSocketConnection);

    // cleanup function to disconnect the socket and setSocket to null in chat store
    return () => {
      chatSocket.disconnect();
      setSocket(null);
      closeChat();
      window.removeEventListener("keydown", handleSaveEvent);
    };
  }, [isLoading, isFetching, data, roomId, setSocket, closeChat]);

  // Global states for toggles
  const chatOpen = useChat((state) => state.chatOpen);
  const toggleChat = useChat((state) => state.toggleChat);

  const terminalOpen = useTerminal((state) => state.terminalOpen);
  const toggleTerminal = useTerminal((state) => state.toggleTerminal);

  const presenceOpen = usePresence((state) => state.presenceOpen);
  const togglePresence = usePresence((state) => state.togglePresence);

  if (isLoading || isFetching || !data)
    return <RoomLoadingComponent Icon={ServerCog} text="Booting your editor" />;

  return (
    <>
      <RoomNavbar
        roomName={data!.roomName!}
        role={data!.role!}
        openInviteModal={() => setIsRoomModalOpen(true)}
      />

      <CodeEditorLayout
        roomId={data!.roomId!}
        roomName={data!.roomName!}
        userName={data!.user.name}
        token={data!.token}
      />
      {/* Presence Sidebar */}
      {presenceOpen && <RoomMemberPresence roomName={data!.roomName} />}

      {/* Chat Sidebar */}
      {chatOpen && <ChatSidebar isOpen={chatOpen} user={user} />}

      {/* Floating Controls */}
      <div className="fixed right-10 bottom-10 flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={terminalOpen ? "default" : "outline"}
                className="cursor-pointer rounded-full"
                onClick={toggleTerminal}
              >
                <TerminalIcon className="size-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle terminal (Ctrl+J)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={chatOpen ? "default" : "outline"}
                className="cursor-pointer rounded-full"
                onClick={() => {
                  if (presenceOpen) {
                    togglePresence();
                    toggleChat();
                  } else {
                    toggleChat();
                  }
                }}
              >
                <MessageCircle className="size-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle chat</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={presenceOpen ? "default" : "outline"}
                className="cursor-pointer rounded-full"
                onClick={() => {
                  if (chatOpen) {
                    toggleChat();
                    togglePresence();
                  } else {
                    togglePresence();
                  }
                }}
              >
                <Users className="size-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>View Online Members</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <RoomShareDialog
        room={{ ...data!.room, roomId: data!.roomId }}
        onClose={() => setIsRoomModalOpen(false)}
        open={isRoomModalOpen}
      />
    </>
  );
};

export default RoomPageComponent;
