import { Languages } from "@/generated/prisma/enums";
import { zodEnumFromPrismaEnum } from "@/lib/zod-util";
import * as z from "zod";

export const ExecuteSchema = z.object({
  roomId: z.string().min(1),
  code: z.string().min(1),
  input: z.string().optional().default(""),
  language: zodEnumFromPrismaEnum(Languages),
});

export type ExecuteValues = z.infer<typeof ExecuteSchema>;
