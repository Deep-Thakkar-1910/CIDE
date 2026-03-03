import db from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { StatusCodes } from "@/lib/constants/StatusCodes";
import { StatusTexts } from "@/lib/constants/StatusTexts";
import { headers, cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify, errors } from "jose";

export async function GET(
  _req: NextRequest,
  { params }: { params: { roomId: string } },
) {
  const { roomId } = await params;
  const cookieStore = await cookies();
  const roomToken = cookieStore.get(`${roomId}-token`);

  const secret = new TextEncoder().encode(process.env.JWT_SECRET); // create the secret for verification and signing

  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user)
      return NextResponse.json(
        { error: StatusTexts.UNAUTHORIZED },
        { status: StatusCodes.UNAUTHORIZED },
      ); // validating user

    // First look for cookie and validate and send data if valid jwt is available
    if (roomToken?.value) {
      try {
        const decoded = await jwtVerify(roomToken.value, secret);
        // succesful validation  if jwtVerify doesn't throw an error
        return NextResponse.json(
          {
            success: true,
            data: { ...decoded.payload, token: roomToken.value },
          },
          { status: StatusCodes.SUCCESS },
        );
      } catch (err) {
        if (err instanceof errors.JWTExpired) {
          console.log(
            "JWT has been expired continuing with new token creation",
          );
        } else if (err instanceof errors.JWTInvalid) {
          // user is trying to forge a token so we return a Forbidden error
          return NextResponse.json(
            { error: "You are not a member of this room." },
            { status: StatusCodes.FORBIDDEN },
          );
        }
      }
    }

    // Ensure user is present in the room
    const userRoomMetaData = await db.roomMember.findFirst({
      where: {
        userId: session.user.id,
        roomId,
      },
      include: {
        room: {
          select: {
            name: true,
          },
        },
      },
    });
    if (!userRoomMetaData)
      return NextResponse.json(
        { error: "You are not a member of this room." },
        { status: StatusCodes.FORBIDDEN },
      );

    const { room, ...rest } = userRoomMetaData; // leave out the room object from the response to keep structure clean

    // Prepare a token to send to websocket for authentication

    const dataToSend = {
      ...rest,
      roomName: room.name,
      token: "",
    };

    const payload = dataToSend;

    const token = await new SignJWT(payload)
      .setProtectedHeader({
        alg: "HS256",
      })
      .setExpirationTime("1h")
      .sign(secret); // we sign a jwt with 1 hour expiry time to send it to cookies for reducing load of db as we can mitigate refetching till 1 hour

    dataToSend.token = token; // sending the token in response for websocket authentication

    const expires = new Date();
    expires.setHours(expires.getHours() + 1);
    cookieStore.set({
      name: `${roomId}-token`,
      value: token,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      httpOnly: true,
      expires,
    });

    return NextResponse.json(
      { success: true, data: dataToSend },
      { status: StatusCodes.SUCCESS },
    );
  } catch (err) {
    if (err instanceof Error) {
      console.error("Error in room auth: ", err.stack);
      return NextResponse.json(
        { error: StatusTexts.SERVER_ERROR },
        { status: StatusCodes.SERVER_ERROR },
      );
    }
  }
}
