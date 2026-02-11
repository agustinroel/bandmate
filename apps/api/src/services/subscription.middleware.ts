import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  TIER_LIMITS,
  tierAtLeast,
  type SubscriptionTier,
} from "@bandmate/shared";
import { supabase } from "../lib/supabase.js";

// Extend Fastify request with subscriptionTier
declare module "fastify" {
  interface FastifyRequest {
    subscriptionTier: SubscriptionTier;
  }
}

/**
 * Fetches the user's subscription tier from their profile.
 * Defaults to 'free' if not found.
 */
async function getUserTier(userId: string): Promise<SubscriptionTier> {
  const { data, error } = await supabase
    .from("profiles")
    .select("subscription_tier, subscription_expires_at")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return "free";

  // If subscription has expired, treat as free
  const tier = data.subscription_tier as SubscriptionTier;
  if (tier !== "free" && data.subscription_expires_at) {
    const expiresAt = new Date(data.subscription_expires_at);
    if (expiresAt < new Date()) return "free";
  }

  return tier || "free";
}

/**
 * Fastify hook: loads subscription tier into request for authenticated users.
 */
export async function subscriptionHook(
  request: FastifyRequest,
  _reply: FastifyReply,
) {
  if (request.user?.id) {
    request.subscriptionTier = await getUserTier(request.user.id);
  } else {
    request.subscriptionTier = "free";
  }
}

/**
 * Higher-order function to guard a route behind a minimum tier.
 * Usage: { preHandler: requireTier('pro') }
 */
export function requireTier(minTier: SubscriptionTier) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!tierAtLeast(request.subscriptionTier, minTier)) {
      return reply.code(403).send({
        statusCode: 403,
        error: "SubscriptionRequired",
        message: `This feature requires a ${minTier} subscription.`,
        requiredTier: minTier,
        currentTier: request.subscriptionTier,
      });
    }
  };
}

/**
 * Checks if the user has reached their resource limit.
 * Returns true if they have exceeded the limit.
 */
export async function checkResourceLimit(
  userId: string,
  resource: "songs" | "setlists",
  tier: SubscriptionTier,
): Promise<boolean> {
  const limits = TIER_LIMITS[tier];
  const maxCount = resource === "songs" ? limits.maxSongs : limits.maxSetlists;

  if (maxCount === Infinity) return false;

  const { count, error } = await supabase
    .from(resource)
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId);

  if (error) return false; // fail open — don't block on errors
  return (count ?? 0) >= maxCount;
}
