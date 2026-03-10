import "dotenv/config";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import {
  setupWSConnection,
  getYDoc,
  setPersistence,
} from "@y/websocket-server/utils";
import * as Y from "yjs";
import { jwtVerify } from "jose";
import { startSnapshotWorker } from "./persistence/snapShotWorker";
import { getRedis } from "./persistence/redis";
import { PostgresqlPersistence } from "y-postgresql";
// import { initPersistence, seedDoc } from "./persistence/yjsPersistence";

const PORT = process.env.PORT || 8080;

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "SUPER_SECRET",
); // Constructing Secret from the env.

// Booting up redis, snapshot worker and yjsPersistence
// new getRedis().getRedisInstance();
// startSnapshotWorker();
// initPersistence();

interface AuthedWebSocket extends WebSocket {
  user: UserMeta;
  roomId: string;
} // extending websocket to include user's data and roomId

const rooms: Map<string, Room> = new Map(); // each room with roomId as key and RoomType as value

const server = createServer();

const yjsWSS = new WebSocketServer({ noServer: true }); // websocket server responsible for yjs relay
const chatWSS = new WebSocketServer({ noServer: true }); // websocket server responsible for chat system

server.on("upgrade", async (req, socket, head) => {
  try {
    const url = new URL(req.url!, "http://localhost");

    const token = url.searchParams.get("token"); // extracting the token from searchParams
    const pathname = url.pathname; // extracting route path (/yjs or /chat)
    const roomId = pathname.split("/").at(-1); // extracting roomId from pathName

    if (!token) throw new Error("Missing token"); // If there is no token present don't allow websocket connection.
    if (!roomId) throw new Error("Missing roomId"); // If there is no token present don't allow websocket connection.

    // verifying jwt using jose
    const decoded = await jwtVerify(token, JWT_SECRET);
    const payload = decoded.payload;

    const isAllowed = payload.roomId === roomId;

    if (!isAllowed) {
      // don't allow the user in the room if auth fails
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      socket.destroy();
      return;
    }

    if (pathname.startsWith("/yjs")) {
      yjsWSS.handleUpgrade(req, socket, head, (ws) => {
        yjsWSS.emit("connection", ws, req); // allow connection if auth passed
      });
    } else if (pathname.startsWith("/chat")) {
      chatWSS.handleUpgrade(req, socket, head, (ws) => {
        const authedWS = ws as AuthedWebSocket;

        // attaching metadata  to websocket
        authedWS.user = payload.user as unknown as UserMeta;
        authedWS.roomId = payload.roomId as unknown as string;

        chatWSS.emit("connection", authedWS, req); // allow connection if auth passed
      });
    } else {
      socket.destroy();
    }
  } catch (err) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n"); // on error restrict websocket connection
    socket.destroy();
  }
});

yjsWSS.on("connection", async (ws, req) => {
  const url = new URL(req.url!, "http://localhost");
  const roomId = url.pathname.split("/").at(-1);
  setupWSConnection(ws, req, {
    docName: roomId, // to setup a y.doc per room
  });
});

// if (
//   !process.env.PGHOST ||
//   !process.env.PGPORT ||
//   !process.env.PGDATABASE ||
//   !process.env.PGUSER ||
//   !process.env.PGPASSWORD
// ) {
//   throw new Error(
//     "Please define the PostgreSQL connection option environment variables",
//   );
// }
// const pgdb = await PostgresqlPersistence.build({
//   host: process.env.PGHOST,
//   port: parseInt(process.env.PGPORT, 10),
//   database: process.env.PGDATABASE,
//   user: process.env.PGUSER,
//   password: process.env.PGPASSWORD,
// });

// setPersistence({
//   bindState: async (docName, ydoc) => {
//     const persistedYdoc = await pgdb.getYDoc(docName);

//     if (persistedYdoc) {
//       // Apply the stored document state correctly
//       const update = Y.encodeStateAsUpdate(persistedYdoc);
//       Y.applyUpdate(ydoc, update);

//       persistedYdoc.destroy();
//     }

//     // Persist every update
//     ydoc.on("update", async (update: Uint8Array) => {
//       await pgdb.storeUpdate(docName, update);
//     });
//   },

//   writeState: async () => {
//     // not needed for y-postgresql incremental updates
//   },

//   provider: null,
// });

chatWSS.on("connection", (ws: AuthedWebSocket) => {
  const roomId = ws.roomId; // extracting roomdId to perform all actions in one room

  // initialize an empty room if it doesn't exist with given roomId
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      clients: new Set(),
      users: new Map(),
    });
  }

  const room = rooms.get(roomId)!;

  // add client to room
  room.clients.add(ws);

  // store user metadata
  room.users.set(ws.user.id, ws.user);

  sendCurrentMembers(room, ws);

  broadcastEvent({ type: "member_added", payload: ws.user }, room, ws); // Broadcast updated presence when user joins

  ws.on("message", (data) => {
    const parsed = JSON.parse(data.toString()); //converting to string from buffer

    const message: ChatMessage = {
      message: parsed.message,
      timestamp: new Date(),
      user: ws.user, // attaching the user that sent the message
    };

    // Broadcast message to everyone in the room.
    broadcastEvent({ type: "chat", payload: message }, room, ws);
  });

  ws.on("close", () => {
    // remove the client from the room when they disconnect
    room.clients.delete(ws);
    room.users.delete(ws.user.id);

    // Broadcast updated presence when user leaves
    broadcastEvent({ type: "member_removed", payload: ws.user }, room, ws);

    // Delete room from map if room gets empty
    if (room.clients.size === 0) {
      rooms.delete(roomId);
    }
  });
});

function broadcastEvent(
  event: SocketEvent,
  room: Room,
  sender: AuthedWebSocket,
) {
  for (const client of room.clients) {
    if (client === sender) continue;
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(event));
    }
  }
}

function sendCurrentMembers(room: Room, ws: AuthedWebSocket) {
  const users = Array.from(room.users.values()); // getting all users associated to the room

  if (ws.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        type: "init_presence", // sending all currently online members to the newly joined member (presence list)
        payload: users,
      }),
    );
  }
}

server.listen(PORT, () => {
  console.log("Websocket Server Running");
});
