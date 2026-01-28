import Fastify from "fastify";
import cors from "@fastify/cors";
import "dotenv/config";

import { registerAuth } from "./plugins/auth.js";
import { songsRoutes } from "./songs/songs.routes.js";
import { setlistsRoutes } from "./setlists/setlists.routes.js";
import { importSeedLibrary } from "./seed/import-seed-library.js";
import { libraryRoutes } from "./library/library.routes.js";
import { worksRoutes } from "./works/works.routes.js";
import { arrangementsRoutes } from "./arrangements/arrangements.routes.js";

if (process.env.SEED_LIBRARY === "true") {
  importSeedLibrary()
    .then(() => console.log("[seed] library imported"))
    .catch((e) => console.error("[seed] failed", e));
}
const app = Fastify({ logger: true });

const allowed = new Set([
  "http://localhost:4200",
  "http://127.0.0.1:4200",
  "http://localhost:5173", // por si alguna vez usás Vite
  "https://bandmate-pink.vercel.app", // prod
]);

await app.register(cors, {
  origin: (origin, cb) => {
    // requests server-to-server o tools sin Origin
    if (!origin) return cb(null, true);

    if (allowed.has(origin)) return cb(null, true);

    return cb(new Error(`CORS blocked for origin: ${origin}`), false);
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});

// Auth (adds app.requireAuth + req.user)
await app.register(registerAuth, { publicRoutes: ["/health", "/debug"] });
app.addHook("preHandler", app.authGuardHook);

// Routes ONLY via plugins
await app.register(songsRoutes);
await app.register(setlistsRoutes);
await app.register(libraryRoutes);
await app.register(worksRoutes);
await app.register(arrangementsRoutes);

app.setErrorHandler((err, req, reply) => {
  const status = (err as any).statusCode ?? 500;

  req.log.error({ err }, "Unhandled error");

  reply.status(status).send({
    statusCode: status,
    error: (err as any).name ?? "Error",
    message: (err as any).message ?? String(err),
  });
});

const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: "0.0.0.0" });
