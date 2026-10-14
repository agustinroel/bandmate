import fp from "fastify-plugin";
import https from "node:https";
import { jwtVerify, errors as JoseErrors, decodeProtectedHeader, importJWK, } from "jose";
function getBearerToken(req) {
    const h = req.headers.authorization;
    if (!h)
        return null;
    const parts = h.split(" ").filter(Boolean);
    if (parts.length < 2)
        return null;
    const type = parts[0]?.toLowerCase();
    const token = parts.slice(1).join(" ").trim();
    if (type !== "bearer" || !token)
        return null;
    return token;
}
function issuerFromSupabaseUrl(supabaseUrl) {
    return `${supabaseUrl.replace(/\/$/, "")}/auth/v1`;
}
function httpError(statusCode, message) {
    const err = new Error(message);
    err.statusCode = statusCode;
    return err;
}
function normalizeJoseError(e) {
    if (e instanceof JoseErrors.JWTExpired)
        return "Token expired";
    if (e instanceof JoseErrors.JWTClaimValidationFailed)
        return "Invalid token claims";
    if (e instanceof JoseErrors.JOSEError)
        return "Invalid token";
    return "Invalid or expired token";
}
// Fetch JWKS manually with SSL bypass for corporate networks
async function fetchJWKS(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, {
            // Only bypass SSL in development (corporate proxy workaround)
            rejectUnauthorized: process.env.NODE_ENV === "production",
        }, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                try {
                    resolve(JSON.parse(data));
                }
                catch (e) {
                    reject(new Error("Invalid JWKS JSON"));
                }
            });
        });
        req.on("error", reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error("JWKS fetch timeout"));
        });
    });
}
async function authPlugin(app, opts) {
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl)
        throw new Error("Missing SUPABASE_URL");
    const issuer = issuerFromSupabaseUrl(supabaseUrl);
    const jwksUrl = process.env.SUPABASE_JWKS_URL ?? `${issuer}/.well-known/jwks.json`;
    // Pre-fetch and cache JWKS at startup
    let cachedKeys = new Map();
    let lastFetch = 0;
    const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
    async function getKeyFromJWKS(kid) {
        const now = Date.now();
        // Refresh cache if expired or empty
        if (cachedKeys.size === 0 || now - lastFetch > CACHE_TTL) {
            try {
                console.log("[AUTH] Fetching JWKS from", jwksUrl);
                const jwks = await fetchJWKS(jwksUrl);
                cachedKeys = new Map();
                for (const key of jwks.keys) {
                    if (key.kid) {
                        const cryptoKey = await importJWK(key, key.alg);
                        cachedKeys.set(key.kid, cryptoKey);
                    }
                }
                lastFetch = now;
                console.log(`[AUTH] Cached ${cachedKeys.size} keys from JWKS`);
            }
            catch (e) {
                console.error("[AUTH] Failed to fetch JWKS:", e.message);
                if (cachedKeys.size === 0)
                    throw e;
                // Use stale cache if we have one
            }
        }
        // Try to find the key by kid, or return the first one
        if (kid && cachedKeys.has(kid)) {
            return cachedKeys.get(kid);
        }
        // Return first key if no kid specified
        const firstKey = cachedKeys.values().next().value;
        if (!firstKey)
            throw new Error("No keys in JWKS cache");
        return firstKey;
    }
    // JWT Secret HS256 - Supabase lo entrega en base64
    const rawSecret = process.env.SUPABASE_JWT_SECRET;
    const jwtSecret = rawSecret
        ? Uint8Array.from(Buffer.from(rawSecret, "base64"))
        : null;
    const publicRoutes = opts.publicRoutes ?? ["/health", "/debug"];
    app.decorate("authenticate", async (req) => {
        const token = getBearerToken(req);
        if (!token)
            throw httpError(401, "Missing bearer token");
        let payload;
        try {
            // Decode header to get algorithm and key id
            let alg = "unknown";
            let kid;
            try {
                const header = decodeProtectedHeader(token);
                alg = header.alg ?? "unknown";
                kid = header.kid;
            }
            catch {
                // Continue with unknown algorithm
            }
            if (alg === "HS256" && jwtSecret) {
                // Token firmado con HS256 (legacy)
                const verified = await jwtVerify(token, jwtSecret, { issuer });
                payload = verified.payload;
            }
            else if (alg === "ES256" || alg === "RS256" || alg === "unknown") {
                // Token firmado con clave asimétrica - usar JWKS
                const key = await getKeyFromJWKS(kid);
                const verified = await jwtVerify(token, key, { issuer });
                payload = verified.payload;
            }
            else {
                throw new Error(`Unsupported algorithm: ${alg}`);
            }
        }
        catch (e) {
            console.error("[AUTH] Verification failed:", e.message);
            throw httpError(401, normalizeJoseError(e));
        }
        const sub = payload?.sub;
        if (!sub || typeof sub !== "string")
            throw httpError(401, "Invalid token: missing sub");
        req.user = {
            id: sub,
            email: typeof payload.email === "string" ? payload.email : undefined,
            role: typeof payload.role === "string" ? payload.role : undefined,
            claims: payload,
        };
    });
    app.decorate("requireAuth", async (req) => app.authenticate(req));
    app.decorate("authGuardHook", async (req) => {
        if (req.method === "OPTIONS")
            return;
        const url = req.url || "";
        const isPublic = publicRoutes.some((p) => url.startsWith(p));
        const token = getBearerToken(req);
        if (token) {
            try {
                await app.authenticate(req);
                return;
            }
            catch (err) {
                if (!isPublic)
                    throw err;
                // On public routes with expired/invalid token, allow request through without req.user
            }
        }
        if (isPublic)
            return;
        await app.authenticate(req);
    });
}
export const registerAuth = fp(authPlugin, {
    name: "bandmate-auth",
});
