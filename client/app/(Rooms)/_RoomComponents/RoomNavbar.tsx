"use client";

import { Button } from "@/components/ui/button";
import { RoomRole } from "@/generated/prisma/enums";
import { RoleLabel } from "@/lib/constants/Roles";
import { LoaderCircle, LogOut, Play, UserPlus } from "lucide-react";
import Link from "next/link";
import { useExecution } from "@/hooks/useExecution";
import { useTerminal } from "@/hooks/useTerminal";
import axios from "@/lib/axios";
import { AxiosError } from "axios";
import { toast } from "sonner";

interface RoomNavbarProps {
  roomId: string;
  roomName: string;
  role: RoomRole;
  openInviteModal: () => void;
}
const RoomNavbar = ({
  roomId,
  roomName,
  role,
  openInviteModal,
}: RoomNavbarProps) => {
  const code = useExecution((state) => state.code);
  const input = useExecution((state) => state.input);
  const language = useExecution((state) => state.language);
  const isRunning = useExecution((state) => state.isRunning);
  const setOutput = useExecution((state) => state.setOutput);
  const setIsRunning = useExecution((state) => state.setIsRunning);
  const openTerminal = useTerminal((state) => state.openTerminal);
  const requestMinSize = useTerminal((state) => state.requestMinSize);

  const handleRun = async () => {
    if (!code.trim()) {
      toast.error("No code to run yet.");
      return;
    }
    window.dispatchEvent(new Event("cide:focus-editor"));

    openTerminal();
    requestMinSize(40);
    setIsRunning(true);

    try {
      setOutput("Running...");
      const result = await axios.post("/execute", {
        roomId,
        code,
        input,
        language,
      });
      setOutput(result.data.output || "No output");
    } catch (err) {
      if (err instanceof AxiosError) {
        setOutput(`Error: ${err.response?.data?.error || err.message}`);
      } else {
        setOutput(`Error: ${String(err)}`);
      }
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <nav className="border-border bg-navbar fixed flex h-16 w-full items-center border-b px-4 backdrop-blur">
      <div className="flex w-1/3 items-center gap-3">
        <Link
          href="/"
          className="bg-primary inline-flex size-10 items-center justify-center rounded-lg"
        >
          <span className="text-primary-foreground text-lg font-bold">
            {"</>"}
          </span>
        </Link>
        <div>
          <p className="text-sm leading-none font-semibold">{roomName}</p>
          <p className="text-muted-foreground text-xs">{RoleLabel[role]}</p>
        </div>
      </div>

      <div className="flex w-1/3 justify-center">
        <Button
          className="cursor-pointer gap-2 rounded-lg px-6"
          onClick={handleRun}
          disabled={isRunning}
        >
          {isRunning ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Play className="size-4" />
          )}
          {isRunning ? "Running..." : "Run"}
        </Button>
      </div>

      <div className="flex w-1/3 items-center justify-end gap-x-4">
        {role === RoomRole.OWNER && (
          <Button
            variant="outline"
            className="cursor-pointer gap-2"
            onClick={openInviteModal}
          >
            <UserPlus className="size-4" />
            Invite
          </Button>
        )}

        <Button
          variant="outline"
          className="text-destructive/80 hover:text-destructive border-destructive! cursor-pointer gap-2"
          asChild
        >
          <Link href="/">
            <LogOut className="size-4" />
            Leave Room
          </Link>
        </Button>
      </div>
    </nav>
  );
};

export default RoomNavbar;
