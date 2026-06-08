/**
 * Gemini API Stability Utilities
 */

/**
 * Retries a generative model request with exponential backoff on transient errors (like 503 or 429)
 * and falls back to a secondary call if all retries are exhausted.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000,
  fallbackFn?: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorMessage = error.message || String(error);
    const statusCode = error.status || (error.statusCode ? error.statusCode() : null);

    // Detect typical transient HTTP codes: 503 (Service Unavailable), 502 (Bad Gateway), 429 (Too Many Requests), 504 (Gateway Timeout)
    const isTransient = 
      statusCode === 503 ||
      statusCode === 502 ||
      statusCode === 429 ||
      statusCode === 504 ||
      errorMessage.includes('503') ||
      errorMessage.includes('502') ||
      errorMessage.includes('429') ||
      errorMessage.includes('Service Unavailable') ||
      errorMessage.includes('high demand') ||
      errorMessage.includes('overloaded');

    if (isTransient && retries > 0) {
      const jitter = Math.floor(Math.random() * 300);
      const sleepTime = delayMs + jitter;
      
      console.warn(`[Gemini API Warning] Transient error encountered: "${errorMessage}". Retrying in ${sleepTime}ms. Retries remaining: ${retries}`);
      
      await new Promise((resolve) => setTimeout(resolve, sleepTime));
      
      // Double the backoff delay
      return retryWithBackoff(fn, retries - 1, delayMs * 2, fallbackFn);
    }

    // If retries failed, run the fallback model function if provided
    if (fallbackFn) {
      console.warn(`[Gemini API Warning] All primary retries exhausted. Invoking fallback model...`);
      try {
        return await fallbackFn();
      } catch (fallbackError: any) {
        console.error(`[Gemini API Error] Fallback model also failed:`, fallbackError);
        throw fallbackError;
      }
    }

    throw error;
  }
}
