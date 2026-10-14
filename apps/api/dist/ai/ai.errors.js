/** Base class so routes / workers can map AI failures without string matching. */
export class AiError extends Error {
    httpStatus;
    retryable;
    constructor(message, httpStatus, retryable) {
        super(message);
        this.httpStatus = httpStatus;
        this.retryable = retryable;
        this.name = new.target.name;
    }
}
/** No API key / model not available. Not retryable. */
export class AiConfigError extends AiError {
    constructor(message) {
        super(message, 503, false);
    }
}
/** Gemini returned 429 / RESOURCE_EXHAUSTED. Retry after `retryAfterMs`. */
export class AiRateLimitError extends AiError {
    retryAfterMs;
    constructor(message, retryAfterMs) {
        super(message, 429, true);
        this.retryAfterMs = retryAfterMs;
    }
}
/** Output was not JSON or failed Zod validation. Retryable (model variance). */
export class AiValidationError extends AiError {
    issues;
    constructor(message, issues) {
        super(message, 502, true);
        this.issues = issues;
    }
}
/** Transient upstream failure (5xx, network). */
export class AiUpstreamError extends AiError {
    constructor(message, httpStatus = 502) {
        super(message, httpStatus, true);
    }
}
const DEFAULT_RATE_LIMIT_BACKOFF_MS = 60_000;
/** Extract `retryDelay: "17s"` hints Gemini sometimes includes in 429 bodies. */
function parseRetryDelayMs(message) {
    const m = /retry(?:Delay)?["']?\s*[:=]?\s*["']?(\d+(?:\.\d+)?)s/i.exec(message);
    return m ? Math.ceil(parseFloat(m[1]) * 1000) : null;
}
/** Normalise any SDK / network error into the AiError hierarchy. */
export function normalizeAiError(err) {
    if (err instanceof AiError)
        return err;
    const anyErr = err;
    const status = typeof anyErr?.status === "number" ? anyErr.status : undefined;
    const message = anyErr?.message ?? String(err);
    if (anyErr?.name === "AbortError") {
        return new AiUpstreamError("AI request aborted", 499);
    }
    if (status === 429 || /RESOURCE_EXHAUSTED/i.test(message)) {
        return new AiRateLimitError(message, parseRetryDelayMs(message) ?? DEFAULT_RATE_LIMIT_BACKOFF_MS);
    }
    if (status === 401 || status === 403 || status === 404) {
        return new AiConfigError(`Gemini rejected the request (${status}): ${message}`);
    }
    if (status === 400) {
        // Bad schema/prompt — retrying the same payload will not help.
        return new AiError(`Gemini bad request: ${message}`, 502, false);
    }
    return new AiUpstreamError(message);
}
