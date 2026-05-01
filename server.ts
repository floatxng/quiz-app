import { createServer } from "node:http";
import next from "next";
import { Server as IOServer } from "socket.io";
import { attachQuizHandlers } from "./src/lib/realtime/engine";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT || 3000);

async function main() {
  const app = next({ dev });
  const handler = app.getRequestHandler();
  await app.prepare();

  const httpServer = createServer((req, res) => handler(req, res));
  const io = new IOServer(httpServer, {
    cors: { origin: true, credentials: true },
    path: "/socket.io",
  });
  attachQuizHandlers(io);

  httpServer.listen(port, () => {
    console.log(`▶ QuizArena on http://localhost:${port} (dev=${dev})`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
