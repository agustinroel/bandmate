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
import { importRoutes } from "./import/import.routes.js";
import { spotifyAuthRoutes } from "./auth/spotify.routes.js";
import { profilesRoutes } from "./profiles/profiles.routes.js";
import { bandsRoutes } from "./bands/bands.routes.js";
import { notificationsRoutes } from "./notifications/notifications.routes.js";
import { eventsRoutes } from "./events/events.routes.js";
import { ticketingRoutes } from "./events/ticketing.routes.js";
import { stripeWebhookRoutes } from "./events/stripe.webhook.js";
import "./services/ingestion-queue.service.js"; // Initialize worker

if (process.env.SEED_LIBRARY === "true") {
  // ... existing seed logic ...
}

const app = Fastify({
  logger: true,
  ignoreTrailingSlash: true,
});

// Hook para capturar el raw body solo en el webhook de Stripe
app.addHook("preParsing", async (request, reply, payload) => {
  // Usamos startsWith para ignorar query strings y filtramos por POST
  if (request.method === "POST" && request.url.startsWith("/webhooks/stripe")) {
    const chunks: Buffer[] = [];
    for await (const chunk of payload) {
      chunks.push(chunk as Buffer);
    }
    const rawBody = Buffer.concat(chunks);
    (request as any).rawBody = rawBody;

    // Devolver un nuevo stream para que Fastify siga procesando
    return (async function* () {
      yield rawBody;
    })();
  }
  return payload;
});

const allowed = new Set([
  "http://localhost:4200",
  "http://127.0.0.1:4200",
  "http://localhost:5173",
]);

if (process.env.FRONTEND_URL) {
  // Soportar múltiples URLs separadas por comas
  const urls = process.env.FRONTEND_URL.split(",")
    .map((u) => u.trim())
    .filter(Boolean);

  for (const rawUrl of urls) {
    let url = rawUrl;
    // Autocompletar protocolo si falta
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }
    // Quitar slash final
    const normalized = url.replace(/\/$/, "");
    allowed.add(normalized);
  }
}

await app.register(cors, {
  origin: (origin, cb) => {
    // requests server-to-server o tools sin Origin
    if (!origin) return cb(null, true);

    const normalizedOrigin = origin.replace(/\/$/, "");

    if (allowed.has(normalizedOrigin)) {
      return cb(null, true);
    }

    app.log.warn(
      `CORS blocked for origin: ${origin} (normalized: ${normalizedOrigin}). Allowed origins: ${Array.from(allowed).join(", ")}`,
    );
    return cb(new Error(`CORS blocked for origin: ${origin}`), false);
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});

// Auth (adds app.requireAuth + req.user)
await app.register(registerAuth, {
  publicRoutes: [
    "/health",
    "/health/cors",
    "/debug",
    "/auth/spotify",
    "/webhooks/stripe",
  ],
});
app.addHook("preHandler", app.authGuardHook);

// Diagnostic Routes
app.get("/health", async () => ({ status: "ok" }));
app.get("/health/cors", async () => ({
  allowedOrigins: Array.from(allowed),
  frontendUrlEnv: process.env.FRONTEND_URL,
}));

// Routes ONLY via plugins
await app.register(songsRoutes);
await app.register(setlistsRoutes);
await app.register(libraryRoutes);
await app.register(worksRoutes);
await app.register(arrangementsRoutes);
await app.register(importRoutes, { prefix: "/import" });
await app.register(spotifyAuthRoutes, { prefix: "/auth/spotify" });
await app.register(profilesRoutes);
await app.register(bandsRoutes);
await app.register(eventsRoutes);
await app.register(ticketingRoutes);
await app.register(stripeWebhookRoutes);
await app.register(notificationsRoutes);

app.setErrorHandler((err, req, reply) => {
  const status = (err as any).statusCode ?? 500;

  req.log.error({ err }, "Unhandled error");

  // Inyectar cabeceras CORS manualmente en errores ya que Fastify-CORS
  // a veces no lo hace si el error corta el ciclo de vida antes de tiempo (ej: 401)
  const origin = req.headers.origin;
  if (origin) {
    const normalizedOrigin = origin.replace(/\/$/, "");
    if (allowed.has(normalizedOrigin)) {
      reply.header("Access-Control-Allow-Origin", origin);
      reply.header("Access-Control-Allow-Credentials", "true");
    }
  }

  reply.status(status).send({
    statusCode: status,
    error: (err as any).name ?? "Error",
    message: (err as any).message ?? String(err),
  });
});

const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: "0.0.0.0" });
