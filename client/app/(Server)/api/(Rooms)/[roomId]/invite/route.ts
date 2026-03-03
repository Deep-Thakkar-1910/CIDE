import { auth } from "@/lib/auth";
import db from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { StatusTexts } from "@/lib/constants/StatusTexts";
import { StatusCodes } from "@/lib/constants/StatusCodes";

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } },
) {
  try {
    // validate the user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user)
      return NextResponse.json(
        { error: StatusTexts.UNAUTHORIZED },
        { status: StatusCodes.UNAUTHORIZED },
      );

    const { role } = await req.json();
    const { roomId } = await params; // get the room id from params

    // ensure the user is the owner of the room
    const membership = await db.roomMember.findFirst({
      where: {
        roomId,
        userId: session.user.id,
        role: "OWNER",
      },
    });

    if (!membership)
      return NextResponse.json(
        { error: StatusTexts.FORBIDDEN },
        { status: StatusCodes.FORBIDDEN },
      );

    // reuse active invite for same role
    const existing = await db.roomInvite.findFirst({
      where: {
        roomId,
        role,
        expiresAt: {
          gt: new Date(), // as we have set ten minutes later time while creating the expiresAt time
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: true,
          inviteUrl: `${process.env.BASE_URL}/join/${existing.token}`,
          expiresAt: existing.expiresAt,
        },
        { status: StatusCodes.SUCCESS },
      );
    }

    const token = crypto.randomBytes(16).toString("hex"); //Generate a 32 digit random number as token
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes

    const invite = await db.roomInvite.create({
      data: {
        roomId,
        role,
        token,
        expiresAt,
      },
    });

    return NextResponse.json(
      {
        success: true,
        inviteUrl: `${process.env.BASE_URL}/join/${invite.token}`,
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof Error) {
      console.error("Error in get invite", err.stack);
    }
    return NextResponse.json(
      { error: StatusTexts.SERVER_ERROR },
      { status: StatusCodes.SERVER_ERROR },
    );
  }
}
