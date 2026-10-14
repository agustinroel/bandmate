import { AiDeepJobRequestSchema, ArrangementStreamRequestSchema, CategorizeRequestSchema, getGateForFeature, } from "@bandmate/shared";
import { aiService } from "./ai.service.js";
import { enqueueDeepJob, getDeepJobStatus } from "./ai-queue.js";
import { AiError, normalizeAiError } from "./ai.errors.js";
import { requireTier } from "../services/subscription.middleware.js";
function parseBody(schema, req, reply) {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        reply.code(400).send({
            statusCode: 400,
            error: "ValidationError",
            message: "Invalid request body",
            issues: result.error.issues,
        });
        return null;
    }
    return result.data;
}
function sendAiError(reply, raw) {
    const err = normalizeAiError(raw);
    return reply.code(err.httpStatus).send({
        statusCode: err.httpStatus,
        error: err.name,
        message: err.message,
    });
}
/** Deep (gemini-pro) tasks share the `ai_suggestions` subscription gate. */
const deepTier = getGateForFeature("ai_suggestions")?.requiredTier ?? "pro";
export const aiRoutes = async (app) => {
    /** fast · POST /ai/categorize — synchronous, Zod-validated. */
    app.post("/ai/categorize", async (req, reply) => {
        const body = parseBody(CategorizeRequestSchema, req, reply);
        if (!body)
            return;
        try {
            return await aiService.categorize(body);
        }
        catch (err) {
            return sendAiError(reply, err);
        }
    });
    /**
     * fast · POST /ai/stream/arrangement — Server-Sent Events.
     * Emits `delta` events with raw JSON fragments and one final `done` event
     * whose payload has been validated against AiArrangementSchema.
     */
    app.post("/ai/stream/arrangement", async (req, reply) => {
        const body = parseBody(ArrangementStreamRequestSchema, req, reply);
        if (!body)
            return;
        const controller = new AbortController();
        reply.hijack();
        const res = reply.raw;
        // Keep CORS headers set by the global onRequest hook.
        const inherited = reply.getHeaders();
        res.writeHead(200, {
            ...inherited,
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
        });
        res.on("close", () => {
            if (!res.writableEnded)
                controller.abort();
        });
        const send = (event) => {
            if (!res.writableEnded)
                res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
        };
        try {
            for await (const ev of aiService.streamArrangement(body, controller.signal)) {
                send(ev);
            }
        }
        catch (raw) {
            if (!controller.signal.aborted) {
                const err = raw instanceof AiError ? raw : normalizeAiError(raw);
                req.log.warn({ err }, "AI stream failed");
                send({ type: "error", message: err.message });
            }
        }
        finally {
            res.end();
        }
    });
    /** deep · POST /ai/jobs — enqueue on BullMQ, returns 202 + jobId. */
    app.post("/ai/jobs", { preHandler: requireTier(deepTier) }, async (req, reply) => {
        if (!req.user) {
            return reply.code(401).send({ statusCode: 401, error: "Unauthorized", message: "User not authenticated" });
        }
        const body = parseBody(AiDeepJobRequestSchema, req, reply);
        if (!body)
            return;
        const accepted = await enqueueDeepJob(body, req.user.id);
        return reply.code(202).send(accepted);
    });
    /** deep · GET /ai/jobs/:id — poll status (owner-scoped). */
    app.get("/ai/jobs/:id", async (req, reply) => {
        if (!req.user) {
            return reply.code(401).send({ statusCode: 401, error: "Unauthorized", message: "User not authenticated" });
        }
        const status = await getDeepJobStatus(req.params.id, req.user.id);
        if (!status) {
            return reply.code(404).send({ statusCode: 404, error: "NotFound", message: "Job not found" });
        }
        return status;
    });
};
