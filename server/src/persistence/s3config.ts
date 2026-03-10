import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getRedis } from "./redis";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.SNAPSHOT_BUCKET;

export async function saveSnapshotToR2(roomId: string, update: Uint8Array) {
  const redis = new getRedis().getRedisInstance();
  const key = `snapshots/${roomId}/${Date.now()}.bin`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: Buffer.from(update),
      ContentType: "application/octet-stream",
    }),
  );

  // Track latest key in Redis for O(1) retrieval — avoids expensive R2 list calls
  await redis.set(`snapshot:latest:${roomId}`, key);
  console.log(`[r2] saved snapshot ${key}`);
}

export async function loadLatestSnapshotFromR2(
  roomId: string,
): Promise<Uint8Array | null> {
  const redis = new getRedis().getRedisInstance();
  const latestKey = await redis.get(`snapshot:latest:${roomId}`);
  if (!latestKey) return null;

  try {
    const res = await s3.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: latestKey }),
    );
    const bytes = await res.Body!.transformToByteArray();
    console.log(`[r2] loaded snapshot ${latestKey}`);
    return bytes;
  } catch (err) {
    console.error(`[r2] failed to load snapshot for ${roomId}:`, err);
    return null;
  }
}
