import { auth } from "@/lib/auth";
import { StatusCodes } from "@/lib/constants/StatusCodes";
import { StatusTexts } from "@/lib/constants/StatusTexts";
import db from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Getting the user id from session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // If there is no user logged in don't allow access
    if (!session?.user)
      return NextResponse.json(
        { error: StatusTexts.UNAUTHORIZED },
        { status: StatusCodes.UNAUTHORIZED },
      );

    const userId = session.user.id;

    // extract query params
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const language = searchParams.get("language")?.trim() || "";
    const type = searchParams.get("type")?.trim() || "";
    const page = Number(searchParams.get("page") || 1);
    const limit = 9; // we keep it a default of 9 because we have a grid of 3 rooms per line

    const skip = (page - 1) * limit;

    const roomFilter: any = {
      // construct room filter based on dashboard search and filters (if not keep it empty to include all rooms)
      ...(search && {
        name: {
          contains: search,
          mode: "insensitive", // case-insensitive search
        },
      }),
      ...(language && { language }),
      ...(type && { type }),
    };

    //  Querying room members collection to get associated rooms of the user
    const rooms = await db.roomMember.findMany({
      where: {
        userId,
        room: roomFilter,
      },
      orderBy: {
        joinedAt: "desc",
      },
      skip,
      take: limit,
      include: {
        room: {
          select: {
            id: true,
            name: true,
            type: true,
            language: true,
            createdAt: true,
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
    });

    // Get total room count of the user for pagination on the dashboard
    const total = await db.roomMember.count({
      where: {
        userId,
        room: roomFilter,
      },
    });

    // Reponse for the dashboard
    const data = rooms.map((rm) => ({
      id: rm.room.id,
      name: rm.room.name,
      type: rm.room.type,
      language: rm.room.language,
      memberCount: rm.room._count.members,
      role: rm.role,
      joinedAt: rm.joinedAt,
      createdAt: rm.room.createdAt,
    }));

    return NextResponse.json(
      {
        success: true,
        data, // actual data
        meta: {
          // metadata for pagination
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: StatusCodes.SUCCESS },
    );
  } catch (error) {
    console.error("GET rooms error:", error);
    return NextResponse.json(
      { error: StatusTexts.SERVER_ERROR },
      { status: StatusCodes.SERVER_ERROR },
    );
  }
}
