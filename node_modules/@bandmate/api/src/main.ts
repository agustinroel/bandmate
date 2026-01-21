import Fastify from "fastify";
import cors from "@fastify/cors";
import "dotenv/config";

import { registerAuth } from "./plugins/auth.js";
import { songsRoutes } from "./songs/songs.routes.js";
import { setlistsRoutes } from "./setlists/setlists.routes.js";

const app = Fastify({ logger: true });

const corsOrigin = process.env.CORS_ORIGIN ?? "true";
await app.register(cors, { origin: corsOrigin === "true" ? true : corsOrigin });

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
