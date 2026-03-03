"use client";

import { Users, FileText, Files, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ElementType, useState } from "react";
import { Languages, RoomRole, RoomType } from "@/generated/prisma/enums";
import { LanguageMetaMap } from "@/lib/constants/AvailableLanguages";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { RoomTypeLabel } from "@/lib/constants/FilteType";
import { RoomShareDialog } from "./RoomShareDialog";
import { useRouter } from "next/navigation";

interface RoomCardProps {
  room: {
    id: string;
    name: string;
    type: RoomType;
    joinedAt: string;
    memberCount: number;
    language: Languages;
    role: RoomRole;
  };
}

export function RoomCard({ room }: RoomCardProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const router = useRouter();
  const formattedDate = new Date(room.joinedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const redirectToRoom = (roomId: string) => {
    router.push(`/room/${roomId}`);
  };

  return (
    <div className="group border-border bg-card hover:bg-secondary/30 hover:border-primary/50 rounded-lg border p-5 transition-all duration-200">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-foreground group-hover:text-primary w-fit max-w-[80%] cursor-pointer truncate text-lg font-semibold transition-colors hover:underline">
            {room.name}
          </h3>
          <p className="text-muted-foreground mt-1 text-xs">
            {room.role === RoomRole.OWNER ? "Created" : "Joined"}{" "}
            {formattedDate}
          </p>
        </div>
        <div className="flex cursor-pointer gap-x-2">
          {room.role === RoomRole.OWNER && (
            <div
              className="bg-primary/10 ml-4 shrink-0 rounded p-2"
              onClick={() => setIsShareModalOpen(true)}
            >
              <TooltipComponent Icon={Share2} tooltipContent="Share" />
            </div>
          )}
          <div className="bg-primary/10 ml-4 shrink-0 rounded p-2">
            {room.type === RoomType.MULTI ? (
              <TooltipComponent
                Icon={Files}
                tooltipContent={RoomTypeLabel[RoomType.MULTI]}
              />
            ) : (
              <TooltipComponent
                Icon={FileText}
                tooltipContent={RoomTypeLabel[RoomType.SINGLE]}
              />
            )}
          </div>
        </div>
      </div>

      {/* Room Type Badge */}
      <div className="mb-4">
        <Badge
          variant={"outline"}
          className="flex items-center justify-center text-xs capitalize"
        >
          <Image
            src={LanguageMetaMap[room.language].imageUrl}
            alt={`${LanguageMetaMap[room.language].displayName} Logo`}
            loading="eager"
            width={12}
            height={12}
            className="size-5 rounded-full"
          />
          <span>{LanguageMetaMap[room.language].displayName}</span>
        </Badge>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Users className="h-4 w-4" />
          <span>
            {room.memberCount} member{room.memberCount !== 1 ? "s" : ""}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-border hover:border-primary hover:text-primary text-foreground cursor-pointer"
          onClick={() => redirectToRoom(room.id)}
        >
          Open
        </Button>
      </div>

      {/* Room invite Dialog box */}
      <RoomShareDialog
        open={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        room={{ roomId: room.id, name: room.name }}
      />
    </div>
  );
}

interface TooltipRendererType {
  Icon: ElementType;
  tooltipContent: string;
}
// Common Tooltip renderer to prevent duplicacy
const TooltipComponent = ({ Icon, tooltipContent }: TooltipRendererType) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Icon className="text-primary size-5" />
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltipContent}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
