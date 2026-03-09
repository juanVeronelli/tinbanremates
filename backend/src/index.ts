import "dotenv/config";
import { createServer } from "http";
import { setupSocket } from "./socket/index.js";
import { app } from "./app.js";

const httpServer = createServer(app);

app.set("io", setupSocket(httpServer));

const PORT = Number(process.env.PORT) || 4000;
const HOST = "0.0.0.0";
httpServer.listen(PORT, HOST, () => {
  console.log(`Tinban Remates API listening on http://${HOST}:${PORT}`);
});
