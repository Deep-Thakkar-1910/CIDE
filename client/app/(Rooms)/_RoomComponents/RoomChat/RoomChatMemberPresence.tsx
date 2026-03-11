import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/hooks/useChat";
import { Fragment } from "react/jsx-runtime";

const RoomMemberPresence = ({ roomName }: { roomName: string }) => {
  const members = useChat((state) => state.members);
  return (
    <div className="fixed top-24 right-10 w-96 min-w-0">
      <div className="text-foreground bg-background h-10 rounded-t-md border border-b-0 p-2">
        <p className="max-w-[95%] truncate text-start text-sm">
          Online Members in {roomName}
        </p>
      </div>
      <ScrollArea className="bg-background h-72 rounded-b-md border">
        <div className="space-y-4 p-4">
          {members.map((member) => (
            <Fragment key={member.id}>
              <div className="flex gap-3" key={member.id}>
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={member.image} />
                    <AvatarFallback>
                      {member.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <span className="ring-background absolute right-0 bottom-0 size-2.5 rounded-full bg-green-600 ring-2" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold">{member.name}</span>
                  </div>
                </div>
              </div>
            </Fragment>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default RoomMemberPresence;
