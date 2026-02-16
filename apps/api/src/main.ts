import "./env.js";
import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { Readable } from "node:stream";

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
import { subscriptionRoutes } from "./subscriptions/subscriptions.routes.js";
import "./services/ingestion-queue.service.js"; // Initialize worker
import { subscriptionHook } from "./services/subscription.middleware.js";

if (process.env.SEED_LIBRARY === "true") {
  // ... existing seed logic ...
}

const app = Fastify({
  logger: true,
  ignoreTrailingSlash: true,
});

// Rate limiting: 100 requests per minute per IP
await app.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
});

// Hook onRequest para CORS "Total Freedom": Inyectar antes de que nadie pueda bloquear
app.addHook("onRequest", async (request, reply) => {
  const origin = request.headers.origin;
  if (isOriginAllowed(origin)) {
    reply.header("Access-Control-Allow-Origin", origin || "*");
    reply.header("Access-Control-Allow-Credentials", "true");
    reply.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PATCH, DELETE, OPTIONS",
    );
    reply.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, Accept",
    );
  }

  // Interceptar Preflight inmediatamente
  if (request.method === "OPTIONS") {
    return reply.code(204).send();
  }
});

// Hook para capturar el raw body solo en el webhook de Stripe
app.addHook("preParsing", async (request, reply, payload) => {
  // Usamos startsWith para ignorar query strings y filtramos por POST
  if (request.method === "POST" && request.url.startsWith("/webhooks/stripe")) {
    request.log.info(
      { url: request.url },
      "Capturando rawBody para Webhook de Stripe...",
    );
    const chunks: Buffer[] = [];
    try {
      for await (const chunk of payload) {
        chunks.push(chunk as Buffer);
      }
      const rawBody = Buffer.concat(chunks);
      (request as any).rawBody = rawBody;
      request.log.info({ size: rawBody.length }, "rawBody capturado con éxito");

      // DEVOLVER UN NUEVO STREAM (Node Native) para que Fastify pueda parsearlo si quiere
      return Readable.from(rawBody);
    } catch (err) {
      request.log.error({ err }, "Error capturando rawBody del webhook");
      throw err;
    }
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

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true; // Server-to-server or tools
  const normalizedOrigin = origin.replace(/\/$/, "");

  // 1. Exact matches
  if (allowed.has(normalizedOrigin)) return true;

  // 2. Vercel subdomains
  if (normalizedOrigin.endsWith(".vercel.app")) return true;

  return false;
}

await app.register(cors, {
  origin: (origin, cb) => {
    if (isOriginAllowed(origin)) {
      return cb(null, true);
    }

    app.log.warn(
      `CORS blocked for origin: ${origin}. Allowed origins: ${Array.from(allowed).join(", ")}`,
    );
    return cb(new Error(`CORS blocked for origin: ${origin}`), false);
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  credentials: true,
});

// Auth (adds app.requireAuth + req.user)
await app.register(registerAuth, {
  publicRoutes: [
    "/health",
    "/health/cors",
    "/health/webhook",
    "/debug",
    "/auth/spotify",
    "/webhooks/stripe",
    "/bands",
    "/profiles",
  ],
});
app.addHook("preHandler", app.authGuardHook);
app.addHook("preHandler", subscriptionHook);

// Diagnostic Routes
app.get("/health", async () => ({ status: "ok" }));
app.get("/health/cors", async () => ({
  allowedOrigins: Array.from(allowed),
  frontendUrlEnv: process.env.FRONTEND_URL,
}));
app.get("/health/webhook", async () => ({
  hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
  secretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 7),
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
await app.register(subscriptionRoutes);

app.setErrorHandler((err, req, reply) => {
  const status = (err as any).statusCode ?? 500;

  req.log.error({ err }, "Unhandled error");

  // Inyectar cabeceras CORS de forma resiliente usando el helper unificado
  const origin = req.headers.origin;
  if (isOriginAllowed(origin)) {
    reply.header("Access-Control-Allow-Origin", origin || "*");
    reply.header("Access-Control-Allow-Credentials", "true");
  }

  reply.status(status).send({
    statusCode: status,
    error: (err as any).name ?? "Error",
    message: (err as any).message ?? String(err),
  });
});

const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: "0.0.0.0" });
