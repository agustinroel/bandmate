import { randomUUID } from "node:crypto";
import { Queue, Worker, UnrecoverableError, type Job, type JobsOptions } from "bullmq";
import { Redis } from "ioredis";
import {
  AI_TASK_TIERS,
  AiDeepJobRequestSchema,
  type AiDeepJobRequest,
  type AiJobAccepted,
  type AiJobState,
  type AiJobStatus,
} from "@bandmate/shared";
import { aiService } from "./ai.service.js";
import { AiRateLimitError, normalizeAiError } from "./ai.errors.js";

/**
 * Queue for `deep` (gemini-2.5-pro) tasks.
 *
 * - Rate limiting: BullMQ group limiter (AI_DEEP_RPM per minute, global across
 *   all API instances because it lives in Redis) + reactive back-off on 429.
 * - Retries: exponential back-off; config/bad-request errors are unrecoverable.
 * - No Redis → in-process fallback with the same retry semantics.
 */
export const AI_DEEP_QUEUE = "ai-deep";

interface AiJobData {
  request: AiDeepJobRequest;
  userId: string;
}

export function aiQueueSettings(env: NodeJS.ProcessEnv = process.env) {
  const int = (v: string | undefined, d: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : d;
  };
  return {
    rpm: int(env.AI_DEEP_RPM, 5),
    concurrency: int(env.AI_DEEP_CONCURRENCY, 2),
    attempts: int(env.AI_DEEP_ATTEMPTS, 4),
    backoffMs: int(env.AI_DEEP_BACKOFF_MS, 5_000),
  };
}

function jobOptions(): JobsOptions {
  const s = aiQueueSettings();
  return {
    attempts: s.attempts,
    backoff: { type: "exponential", delay: s.backoffMs },
    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail: { age: 24 * 3600 },
  };
}

let queue: Queue<AiJobData> | null = null;
let worker: Worker<AiJobData> | null = null;
let connection: Redis | null = null;
let redisHealthy = false;

/** Worker processor (exported for unit tests). */
export async function processAiJob(
  job: Pick<Job<AiJobData>, "data" | "id">,
  w?: Pick<Worker, "rateLimit">,
): Promise<unknown> {
  const parsed = AiDeepJobRequestSchema.safeParse(job.data?.request);
  if (!parsed.success) {
    throw new UnrecoverableError(`Invalid AI job payload: ${parsed.error.message}`);
  }
  try {
    return await aiService.runDeepTask(parsed.data);
  } catch (raw) {
    const err = normalizeAiError(raw);
    if (err instanceof AiRateLimitError && w) {
      // Pause the whole queue for the server-suggested window, then requeue
      // this job without consuming an attempt.
      await w.rateLimit(err.retryAfterMs);
      throw Worker.RateLimitError();
    }
    if (!err.retryable) throw new UnrecoverableError(err.message);
    throw err;
  }
}

export function initAiQueue(redisUrl = process.env.REDIS_URL): void {
  if (queue || !redisUrl) {
    if (!redisUrl) console.warn("[AI-Queue] No REDIS_URL — deep AI jobs run inline.");
    return;
  }
  const s = aiQueueSettings();
  connection = new Redis(redisUrl, { maxRetriesPerRequest: null, connectTimeout: 5000 });
  connection.on("ready", () => (redisHealthy = true));
  connection.on("error", (e) => {
    if (redisHealthy) console.error("[AI-Queue] Redis error, using inline mode:", e.message);
    redisHealthy = false;
  });

  queue = new Queue<AiJobData>(AI_DEEP_QUEUE, { connection, defaultJobOptions: jobOptions() });
  worker = new Worker<AiJobData>(AI_DEEP_QUEUE, (job) => processAiJob(job, worker!), {
    connection,
    concurrency: s.concurrency,
    limiter: { max: s.rpm, duration: 60_000 },
  });
  worker.on("failed", (job, err) =>
    console.error(`[AI-Queue] job ${job?.id} (${job?.data.request.task}) failed:`, err.message),
  );
}

// ---------------------------------------------------------------------------
// Inline fallback (no Redis): in-memory jobs with identical retry semantics.
// ---------------------------------------------------------------------------

interface InlineJob {
  userId: string;
  task: AiDeepJobRequest["task"];
  state: AiJobState;
  attemptsMade: number;
  result?: unknown;
  error?: string;
  expiresAt: number;
}
const inlineJobs = new Map<string, InlineJob>();
const INLINE_TTL_MS = 3600_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function runInline(id: string, request: AiDeepJobRequest) {
  const job = inlineJobs.get(id)!;
  const { attempts, backoffMs } = aiQueueSettings();
  while (job.attemptsMade < attempts) {
    job.state = "active";
    try {
      job.result = await aiService.runDeepTask(request);
      job.state = "completed";
      return;
    } catch (raw) {
      const err = normalizeAiError(raw);
      job.attemptsMade++;
      job.error = err.message;
      if (!err.retryable || job.attemptsMade >= attempts) break;
      job.state = "delayed";
      await sleep(
        err instanceof AiRateLimitError
          ? err.retryAfterMs
          : backoffMs * 2 ** (job.attemptsMade - 1),
      );
    }
  }
  job.state = "failed";
}

function gcInline() {
  const now = Date.now();
  for (const [id, j] of inlineJobs) if (j.expiresAt < now) inlineJobs.delete(id);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function enqueueDeepJob(
  request: AiDeepJobRequest,
  userId: string,
): Promise<AiJobAccepted> {
  const tier = AI_TASK_TIERS[request.task];
  if (queue && redisHealthy) {
    try {
      const job = await queue.add(request.task, { request, userId }, { jobId: randomUUID() });
      return { jobId: job.id!, task: request.task, tier, mode: "queued" };
    } catch (e) {
      console.warn("[AI-Queue] enqueue failed, falling back inline:", (e as Error).message);
    }
  }
  gcInline();
  const id = `inline-${randomUUID()}`;
  inlineJobs.set(id, {
    userId,
    task: request.task,
    state: "waiting",
    attemptsMade: 0,
    expiresAt: Date.now() + INLINE_TTL_MS,
  });
  void runInline(id, request);
  return { jobId: id, task: request.task, tier, mode: "inline" };
}

/** Returns null when the job does not exist or belongs to another user. */
export async function getDeepJobStatus(
  jobId: string,
  userId: string,
): Promise<AiJobStatus | null> {
  const inline = inlineJobs.get(jobId);
  if (inline) {
    if (inline.userId !== userId) return null;
    return {
      jobId,
      task: inline.task,
      state: inline.state,
      attemptsMade: inline.attemptsMade,
      result: inline.state === "completed" ? inline.result : undefined,
      error: inline.state === "failed" ? inline.error : undefined,
    };
  }
  if (!queue) return null;
  const job = await queue.getJob(jobId);
  if (!job || job.data.userId !== userId) return null;

  const raw = await job.getState();
  const state: AiJobState =
    raw === "waiting" || raw === "active" || raw === "delayed" ||
    raw === "completed" || raw === "failed"
      ? raw
      : raw === "prioritized" || raw === "waiting-children"
        ? "waiting"
        : "unknown";
  return {
    jobId,
    task: job.data.request.task,
    state,
    attemptsMade: job.attemptsMade,
    result: state === "completed" ? job.returnvalue : undefined,
    error: state === "failed" ? job.failedReason : undefined,
  };
}

export async function closeAiQueue(): Promise<void> {
  await worker?.close();
  await queue?.close();
  connection?.disconnect();
  worker = null;
  queue = null;
  connection = null;
  redisHealthy = false;
}
