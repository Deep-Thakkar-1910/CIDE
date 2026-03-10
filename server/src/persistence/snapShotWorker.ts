import { getRedis } from "./redis";
import { saveSnapshotToR2 } from "./s3config";
import { yjsRedisKey } from "./yjsPersistence";

const SNAPSHOT_INTERVAL_MS = parseInt(
  process.env.SNAPSHOT_INTERVAL_MS || "300000", // 5min default
);

async function runSnapshotWorker() {
  const redis = new getRedis().getRedisInstance();
  let cursor = "0";

  do {
    const [nextCursor, keys] = await redis.scan(
      cursor,
      "MATCH",
      "yjs:doc:*",
      "COUNT",
      "100",
    );
    cursor = nextCursor;

    for (const key of keys) {
      const roomId = key.replace("yjs:doc:", "");
      const b64 = await redis.get(yjsRedisKey(roomId));
      if (!b64) continue;

      const update = Buffer.from(b64, "base64");
      await saveSnapshotToR2(roomId, update);
    }
  } while (cursor !== "0");
}

export function startSnapshotWorker() {
  setInterval(async () => {
    console.log("[snapshot worker] running...");
    try {
      await runSnapshotWorker();
    } catch (err) {
      console.error("[snapshot worker] error:", err);
    }
  }, SNAPSHOT_INTERVAL_MS);

  console.log(`[snapshot worker] started — interval ${SNAPSHOT_INTERVAL_MS}ms`);
}
