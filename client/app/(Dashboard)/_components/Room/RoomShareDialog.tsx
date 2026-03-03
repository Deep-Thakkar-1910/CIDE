"use client";

import { useState } from "react";
import axios from "@/lib/axios";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldTitle,
  FieldDescription,
} from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RoomRole } from "@/generated/prisma/enums";
import {
  InputGroup,
  InputGroupButton,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useQuery } from "@tanstack/react-query";
import { Copy, Check } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  room: { roomId: string; name: string };
}
const handleGenerate = async (role: RoomRole, roomId: string) => {
  try {
    const res = await axios.post(`/${roomId}/invite`, {
      role,
    });

    if (res.data.success) {
      return res.data.inviteUrl;
    }
  } catch {
    toast.error("Failed to generate invite link");
  }
};

export function RoomShareDialog({ open, onClose, room }: Props) {
  const [role, setRole] = useState<RoomRole>(RoomRole.MEMBER);
  const [copied, setCopied] = useState<boolean>(false);

  const { data, isLoading, refetch, isStale } = useQuery({
    queryKey: ["invites", { roomId: room.roomId, role }],
    queryFn: () => handleGenerate(role, room.roomId),
    enabled: false, // to disable fetching on mount
    staleTime: 10 * 60 * 1000, // 10 minute stale time to avoid duplicate api calls as our link expiry is 10 minutes
  });

  const handleGenerateclick = () => {
    refetch();
  };

  const handleCopy = async () => {
    if (!data) {
      toast.info("Please generate an invite link first!");
      return;
    }
    await navigator.clipboard.writeText(data);
    setCopied(true);
    toast.success("Invite link copied!", {
      description: "This invite is only valid for the next 10 minutes!",
    });
    setTimeout(() => setCopied(false), 2000); // set copied variable to false after 2 second to change icon
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent showCloseButton={false}>
        <DialogHeader className="min-w-0">
          <DialogTitle className="max-w-[90%] truncate">
            Invite Collaborators to {room.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <RadioGroup
            value={role}
            onValueChange={(val) => setRole(val as RoomRole)}
            className="space-y-3"
          >
            {/* MEMBER */}
            <FieldLabel htmlFor="member-role">
              <Field
                orientation="horizontal"
                className="border-border hover:bg-secondary/40 flex cursor-pointer items-center gap-4 rounded-lg border p-4"
              >
                <RadioGroupItem value={RoomRole.MEMBER} id="member-role" />
                <FieldContent className="flex-1">
                  <FieldTitle>Member</FieldTitle>
                  <FieldDescription>
                    Can edit and collaborate in the room
                  </FieldDescription>
                </FieldContent>
              </Field>
            </FieldLabel>

            {/* SPECTATOR */}
            <FieldLabel htmlFor="spectator-role">
              <Field
                orientation="horizontal"
                className="border-border flex cursor-not-allowed items-center gap-4 rounded-lg border p-4 opacity-60"
              >
                <RadioGroupItem
                  value="SPECTATOR"
                  id="spectator-role"
                  disabled
                />
                <FieldContent className="flex-1">
                  <div className="flex items-center justify-between">
                    <FieldTitle>Spectator</FieldTitle>
                    <Badge>Coming Soon</Badge>
                  </div>
                  <FieldDescription>Read-only access</FieldDescription>
                </FieldContent>
              </Field>
            </FieldLabel>
          </RadioGroup>

          <Field>
            <FieldLabel htmlFor="username">Invite Link</FieldLabel>
            <InputGroup>
              <InputGroupInput readOnly value={data ?? ""} />
              <InputGroupAddon align={"inline-end"}>
                <InputGroupButton
                  size={"icon-xs"}
                  title="Copy"
                  onClick={handleCopy}
                >
                  {copied ? <Check /> : <Copy />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </div>

        <DialogFooter className="mt-6">
          <Button
            onClick={handleGenerateclick}
            disabled={isLoading}
            className="w-full cursor-pointer"
          >
            {isLoading
              ? "Generating..."
              : isStale || !data
                ? "Generate Link"
                : "Above is your active invite link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
