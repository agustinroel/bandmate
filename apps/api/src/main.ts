import Fastify from "fastify";
import cors from "@fastify/cors";
import "dotenv/config";

import { registerAuth } from "./plugins/auth.js";
import { songsRoutes } from "./songs/songs.routes.js";
import { setlistsRoutes } from "./setlists/setlists.routes.js";

const app = Fastify({ logger: true });

const allowed = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

await app.register(cors, {
  origin: (origin, cb) => {
    // server-to-server / curl / same-origin
    if (!origin) return cb(null, true);

    // allow all (modo emergencia)
    if (allowed.includes("*")) return cb(null, true);

    // exact match list
    if (allowed.includes(origin)) return cb(null, true);

    // allow any vercel preview
    if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return cb(null, true);

    cb(new Error(`CORS blocked for origin: ${origin}`), false);
  },
  credentials: true,
});

// Auth (adds app.requireAuth + req.user)
await app.register(registerAuth, { publicRoutes: ["/health", "/debug"] });
app.addHook("preHandler", app.authGuardHook);

// Routes ONLY via plugins
await app.register(songsRoutes);
await app.register(setlistsRoutes);

app.setErrorHandler((err, req, reply) => {
  const status = (err as any).statusCode ?? 500;
  reply.status(status).send({ message: err });
});

const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: "0.0.0.0" });
