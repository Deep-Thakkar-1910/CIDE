import { auth } from "@/lib/auth";
import { StatusCodes } from "@/lib/constants/StatusCodes";
import { StatusTexts } from "@/lib/constants/StatusTexts";
import db from "@/lib/prisma";
import { RoomSchema } from "@/lib/schemas/roomSchema";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  try {
    // Validate the user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user)
      return NextResponse.json(
        { error: StatusTexts.UNAUTHORIZED },
        { status: StatusCodes.UNAUTHORIZED },
      );

    const body = await req.json();
    const parsed = RoomSchema.safeParse(body);

    // schema validation

    if (!parsed.success)
      return NextResponse.json(
        { error: StatusTexts.BAD_REQUEST },
        { status: StatusCodes.BAD_REQUEST },
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
    if (room)
      return NextResponse.json(
        { success: true, room },
        { status: StatusCodes.POST_SUCCESS },
      );
  } catch (err) {
    if (err instanceof Error) {
      console.error("Error in createroom: ", err.stack);
      return NextResponse.json(
        { error: StatusTexts.SERVER_ERROR },
        { status: StatusCodes.SERVER_ERROR },
      );
    }
  }
}
