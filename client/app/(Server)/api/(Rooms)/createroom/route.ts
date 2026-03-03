import { auth } from "@/lib/auth";
import db from "@/lib/prisma";
import { RoomSchema } from "@/lib/schemas/roomSchema";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  // Validate the user
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user)
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );

  const body = await req.json();
  const parsed = RoomSchema.safeParse(body);

  // schema validation

  if (!parsed.success)
    return NextResponse.json(
      { success: false, error: "Bad Request" },
      { status: 400 },
    );

  const room = await db.room.create({
    data: {
      language: parsed.data.language,
      name: parsed.data.name,
      type: parsed.data.type,
      members: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
    },
  });
  if (room) return NextResponse.json({ success: true, room }, { status: 201 });
}
