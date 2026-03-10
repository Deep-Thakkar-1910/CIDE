import * as Y from "yjs";
import { setPersistence } from "@y/websocket-server/utils";
import { getRedis } from "./redis";
import { loadLatestSnapshotFromR2 } from "./s3config";

const ROOM_TTL_SECONDS = parseInt(process.env.ROOM_TTL_SECONDS || "86400");
const yjsRedisKey = (roomId: string) => `yjs:doc:${roomId}`;
const persistDebounce = new Map<string, ReturnType<typeof setTimeout>>();

export function initPersistence() {
  setPersistence({
    provider: null,

    bindState: async (docName: string, ydoc: Y.Doc) => {
      const redis = new getRedis().getRedisInstance();

      const b64 = await redis.get(yjsRedisKey(docName));
      if (b64) {
        Y.applyUpdate(ydoc, Buffer.from(b64, "base64"), "redis-load");
        console.log(`[yjs] seeded ${docName} from Redis`);
      } else {
        const r2Data = await loadLatestSnapshotFromR2(docName);
        if (r2Data) {
          Y.applyUpdate(ydoc, r2Data, "redis-load");
          console.log(`[yjs] seeded ${docName} from R2`);
        } else {
          console.log(`[yjs] new doc ${docName}`);
        }
      }
      // no update listener at all — we don't touch Redis while users are active
    },

    writeState: async (docName: string, ydoc: Y.Doc) => {
      // called automatically when last user leaves the room
      const redis = new getRedis().getRedisInstance();
      const fullState = Y.encodeStateAsUpdate(ydoc);
      const b64 = Buffer.from(fullState).toString("base64");
      await redis.set(yjsRedisKey(docName), b64, "EX", ROOM_TTL_SECONDS);
      console.log(`[yjs] persisted ${docName} to Redis on room close`);
    },
  });
}

export { yjsRedisKey };
