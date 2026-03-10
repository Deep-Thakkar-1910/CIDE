import axios from "axios";
import { createHash } from "crypto";
import { auth } from "@/lib/auth";
import { StatusCodes } from "@/lib/constants/StatusCodes";
import { StatusTexts } from "@/lib/constants/StatusTexts";
import db from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { ExecuteSchema } from "@/lib/schemas/executeSchema";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Languages } from "@/generated/prisma/enums";
import { LanguageMetaMap } from "@/lib/constants/AvailableLanguages";

type ExecuteResult = {
  output: string;
  status: string;
  exitCode: number | null;
};

type Judge0Response = {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status?: { id: number; description: string };
  exit_code?: number | null;
};

function encodeBase64(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

function decodeBase64(value: string | null): string | null {
  if (!value) return value;
  try {
    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    return value;
  }
}

function createExecutionHash(
  roomId: string,
  code: string,
  input: string,
  language: Languages,
) {
  return createHash("sha256")
    .update(`${roomId}:${language}:${code}:${input}`)
    .digest("hex");
}

async function executeWithJudge0(
  language: Languages,
  code: string,
  input: string,
): Promise<ExecuteResult> {
  const baseUrl = process.env.JUDGE0_BASE_URL;
  if (!baseUrl) {
    throw new Error("JUDGE0_BASE_URL is not configured");
  }

  const headers: Record<string, string> = {};
  if (process.env.JUDGE0_API_KEY) {
    headers["X-Auth-Token"] = process.env.JUDGE0_API_KEY;
  }

  const { data } = await axios.post<Judge0Response>(
    `${baseUrl}/submissions?base64_encoded=true&wait=true`,
    {
      source_code: encodeBase64(code),
      stdin: encodeBase64(input || ""),
      language_id: LanguageMetaMap[language].judge0Code,
      cpu_time_limit: 5,
      wall_time_limit: 10,
      memory_limit: 256000,
      stack_limit: 64000,
      max_processes_and_or_threads: 30,
      max_file_size: 1024,
      max_output_size: 10240,
      compilation_time_limit: 20,
    },
    { headers, timeout: 60000 },
  );

  console.log("DAta: ", data);

  const stdout = decodeBase64(data.stdout);
  const stderr = decodeBase64(data.stderr);
  const compileOutput = decodeBase64(data.compile_output);
  const message = decodeBase64(data.message);

  const outputParts = [stdout, stderr, compileOutput, message]
    .map((part) => (part ?? "").trim())
    .filter((part) => part.length > 0);
  const output =
    outputParts.join("\n") ||
    data.status?.description ||
    "No output";

  return {
    output,
    status: data.status?.description || "unknown",
    exitCode: data.exit_code ?? null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { error: StatusTexts.UNAUTHORIZED },
        { status: StatusCodes.UNAUTHORIZED },
      );
    }

    const body = await req.json();
    const parsed = ExecuteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "roomId and code are required" },
        { status: StatusCodes.BAD_REQUEST },
      );
    }
    const { roomId, code, input, language } = parsed.data;

    const member = await db.roomMember.findFirst({
      where: {
        roomId,
        userId: session.user.id,
      },
      select: { id: true },
    });
    if (!member) {
      return NextResponse.json(
        { error: "You are not a member of this room." },
        { status: StatusCodes.FORBIDDEN },
      );
    }

    const hash = createExecutionHash(roomId, code, input, language);
    console.log("hash: ", hash, roomId, code, input, language);
    const cacheKey = `execution:result:${hash}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log("cached result;");
      const parsed = JSON.parse(cached) as ExecuteResult;
      return NextResponse.json({
        cached: true,
        output: parsed.output,
        meta: parsed,
      });
    }

    const result = await executeWithJudge0(language, code, input);
    console.log("Result: ", result);
    await redis.set(
      cacheKey,
      JSON.stringify(result),
      "EX",
      parseInt(process.env.RESULT_TTL_SECONDS || "3600", 10),
    );

    return NextResponse.json({
      cached: false,
      output: result.output,
      meta: result,
    });
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status ?? StatusCodes.SERVER_ERROR;
      const message =
        typeof err.response?.data === "object" &&
        err.response?.data &&
        "message" in err.response.data
          ? String((err.response.data as { message?: string }).message)
          : err.message;
      return NextResponse.json(
        { error: message || StatusTexts.SERVER_ERROR },
        { status },
      );
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : StatusTexts.SERVER_ERROR },
      { status: StatusCodes.SERVER_ERROR },
    );
  }
}
