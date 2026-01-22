import type { FastifyInstance, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { createRemoteJWKSet, jwtVerify, errors as JoseErrors } from "jose";

type AuthedUser = {
  id: string;
  email?: string;
  role?: string;
  claims: Record<string, unknown>;
};

function getBearerToken(req: FastifyRequest): string | null {
  const h = req.headers.authorization;
  if (!h) return null;

  // soporta "Bearer   token" y casos raros con espacios
  const parts = h.split(" ").filter(Boolean);
  if (parts.length < 2) return null;

  const type = parts[0]?.toLowerCase();
  const token = parts.slice(1).join(" ").trim();

  if (type !== "bearer" || !token) return null;
  return token;
}

function issuerFromSupabaseUrl(supabaseUrl: string) {
  return `${supabaseUrl.replace(/\/$/, "")}/auth/v1`;
}

function httpError(statusCode: number, message: string) {
  const err: any = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function normalizeJoseError(e: unknown): string {
  if (e instanceof JoseErrors.JWTExpired) return "Token expired";
  if (e instanceof JoseErrors.JWTClaimValidationFailed)
    return "Invalid token claims";
  if (e instanceof JoseErrors.JOSEError) return "Invalid token";
  return "Invalid or expired token";
}

export type AuthPluginOptions = {
  /**
   * Rutas que NO requieren auth (ej: health, debug).
   * Se comparan por prefix.
   */
  publicRoutes?: string[];
};

async function authPlugin(app: FastifyInstance, opts: AuthPluginOptions) {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) throw new Error("Missing SUPABASE_URL");

  const issuer = issuerFromSupabaseUrl(supabaseUrl);

  // JWKS (RS256) por defecto
  const jwksUrl =
    process.env.SUPABASE_JWKS_URL ?? `${issuer}/.well-known/jwks.json`;
  const JWKS = createRemoteJWKSet(new URL(jwksUrl));

  // Fallback HS256 si lo configurás (no siempre hace falta en Supabase)
  const jwtSecret = process.env.SUPABASE_JWT_SECRET
    ? new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET)
    : null;

  const publicRoutes = opts.publicRoutes ?? ["/health", "/debug"];

  app.decorate("authenticate", async (req: FastifyRequest) => {
    const token = getBearerToken(req);
    if (!token) throw httpError(401, "Missing bearer token");

    let payload: any;

    try {
      // 1) Preferimos JWKS
      try {
        const verified = await jwtVerify(token, JWKS, { issuer });
        payload = verified.payload;
      } catch (e) {
        // 2) Fallback HS256 (si está configurado)
        if (!jwtSecret) throw e;
        const verified = await jwtVerify(token, jwtSecret, { issuer });
        payload = verified.payload;
      }
    } catch (e) {
      throw httpError(401, normalizeJoseError(e));
    }

    const sub = payload?.sub;
    if (!sub || typeof sub !== "string")
      throw httpError(401, "Invalid token: missing sub");

    // adjuntamos el user al request
    req.user = {
      id: sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
      role: typeof payload.role === "string" ? payload.role : undefined,
      claims: payload as Record<string, unknown>,
    };
  });

  // Alias más semántico, por compat con tu código previo
  app.decorate("requireAuth", async (req: FastifyRequest) =>
    app.authenticate(req),
  );

  // Hook global opcional: si lo querés global, registralo en main con app.addHook.
  app.decorate("authGuardHook", async (req: FastifyRequest) => {
    // rutas públicas por prefix
    const url = req.url || "";
    if (publicRoutes.some((p) => url.startsWith(p))) return;

    await app.authenticate(req);
  });
}

export const registerAuth = fp(authPlugin, {
  name: "bandmate-auth",
});

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthedUser;
  }

  interface FastifyInstance {
    authenticate: (req: FastifyRequest) => Promise<void>;
    requireAuth: (req: FastifyRequest) => Promise<void>;
    authGuardHook: (req: FastifyRequest) => Promise<void>;
  }
}
