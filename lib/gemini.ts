/**
 * Gemini API Stability Utilities
 */

/**
 * Retries a generative model request with exponential backoff on transient errors (like 503 or 429)
 * and falls back to secondary calls if all retries are exhausted.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000,
  fallbackFn?: (() => Promise<T>) | Array<() => Promise<T>>
): Promise<T> {
  const fallbacks: Array<() => Promise<T>> = fallbackFn
    ? (Array.isArray(fallbackFn) ? fallbackFn : [fallbackFn])
    : [];

  try {
    return await fn();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errObj = typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : null;
    const statusCode = typeof errObj?.status === 'number'
      ? errObj.status
      : typeof (errObj?.statusCode as (() => number) | undefined) === 'function'
        ? (errObj?.statusCode as () => number)()
        : null;

    // Detect typical client-side / input validation errors that should NOT be retried or sent to fallbacks
    // (e.g. 400 Bad Request, INVALID_ARGUMENT, unsupported MIME type, missing API key)
    const isClientError =
      statusCode === 400 ||
      statusCode === 401 ||
      statusCode === 403 ||
      errorMessage.includes('INVALID_ARGUMENT') ||
      errorMessage.includes('Unsupported MIME type') ||
      errorMessage.includes('API key not valid') ||
      errorMessage.includes('is missing from environment variables');

    if (isClientError) {
      console.error(`[Gemini API Client Error] Non-retryable error: "${errorMessage}"`);
      throw error;
    }

    // Detect typical transient HTTP codes: 503 (Service Unavailable), 502 (Bad Gateway), 429 (Too Many Requests), 504 (Gateway Timeout)
    const isTransient = 
      statusCode === 503 ||
      statusCode === 502 ||
      statusCode === 429 ||
      statusCode === 504 ||
      errorMessage.includes('503') ||
      errorMessage.includes('502') ||
      errorMessage.includes('429') ||
      errorMessage.includes('RESOURCE_EXHAUSTED') ||
      errorMessage.includes('Service Unavailable') ||
      errorMessage.includes('high demand') ||
      errorMessage.includes('overloaded');

    if (isTransient && retries > 0) {
      const jitter = Math.floor(Math.random() * 300);
      const sleepTime = delayMs + jitter;
      
      console.warn(`[Gemini API Warning] Transient error encountered: "${errorMessage}". Retrying in ${sleepTime}ms. Retries remaining: ${retries}`);
      
      await new Promise((resolve) => setTimeout(resolve, sleepTime));
      
      // Double the backoff delay
      return retryWithBackoff(fn, retries - 1, delayMs * 2, fallbacks);
    }

    // If retries failed or model is unavailable (e.g. 404 or transient exhaustion), try fallback models in sequence
    if (fallbacks.length > 0) {
      const [nextFallback, ...remainingFallbacks] = fallbacks;
      console.warn(`[Gemini API Warning] Primary request failed ("${errorMessage}"). Invoking fallback model (${remainingFallbacks.length} alternatives remaining)...`);
      try {
        return await retryWithBackoff(nextFallback, 1, 1000, remainingFallbacks);
      } catch (fallbackError: unknown) {
        const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        console.error(`[Gemini API Error] Fallback model failed: ${fallbackMsg}`);
        // Preserve both primary error and fallback error so root cause is never hidden
        throw new Error(`Primary request failed: ${errorMessage} | Fallback also failed: ${fallbackMsg}`);
      }
    }

    throw error;
  }
}

