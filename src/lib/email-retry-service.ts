/**
 * Email Retry Service
 * Implements exponential backoff retry logic for failed email deliveries
 */

interface RetryConfig {
  maxRetries: number
  initialDelay: number // milliseconds
  maxDelay: number // milliseconds
  backoffMultiplier: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  context: string = 'operation'
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      console.log(`🔄 [RETRY] Attempt ${attempt + 1}/${finalConfig.maxRetries + 1} for ${context}`)
      
      const result = await fn()
      
      if (attempt > 0) {
        console.log(`✅ [RETRY] ${context} succeeded after ${attempt} retries`)
      }
      
      return result
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Don't retry on last attempt
      if (attempt === finalConfig.maxRetries) {
        console.error(`❌ [RETRY] ${context} failed after ${attempt + 1} attempts:`, lastError.message)
        break
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        finalConfig.initialDelay * Math.pow(finalConfig.backoffMultiplier, attempt),
        finalConfig.maxDelay
      )
      
      console.warn(`⚠️ [RETRY] ${context} failed (attempt ${attempt + 1}), retrying in ${delay}ms...`, lastError.message)
      
      // Wait before retrying
      await sleep(delay)
    }
  }
  
  // All retries exhausted
  throw lastError || new Error(`${context} failed after ${finalConfig.maxRetries + 1} attempts`)
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Determine if error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors are retryable
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return true
  }
  
  // Rate limit errors are retryable
  if (error.message?.includes('rate limit') || error.message?.includes('429')) {
    return true
  }
  
  // Temporary server errors are retryable
  if (error.message?.includes('503') || error.message?.includes('502')) {
    return true
  }
  
  // Invalid API key is NOT retryable
  if (error.message?.includes('Invalid Token') || error.message?.includes('401')) {
    return false
  }
  
  // Invalid email format is NOT retryable
  if (error.message?.includes('Invalid email') || error.message?.includes('400')) {
    return false
  }
  
  // Default: retry on unknown errors (conservative approach)
  return true
}

/**
 * Retry wrapper specifically for email sending
 */
export async function retryEmailSend<T>(
  sendFn: () => Promise<T>,
  context: { to: string; subject: string }
): Promise<T> {
  return retryWithBackoff(
    sendFn,
    {
      maxRetries: 3,
      initialDelay: 2000, // 2 seconds for email
      maxDelay: 60000, // 1 minute max
      backoffMultiplier: 3 // More aggressive backoff for email
    },
    `Email to ${context.to}: "${context.subject}"`
  )
}

/**
 * Batch retry - process array of items with retry for each
 */
export async function retryBatch<T, R>(
  items: T[],
  processFn: (item: T) => Promise<R>,
  options: {
    batchSize?: number
    retryConfig?: Partial<RetryConfig>
    onItemSuccess?: (item: T, result: R) => void
    onItemFailure?: (item: T, error: Error) => void
  } = {}
): Promise<{ successes: R[]; failures: Array<{ item: T; error: Error }> }> {
  const batchSize = options.batchSize || 10
  const successes: R[] = []
  const failures: Array<{ item: T; error: Error }> = []
  
  // Process in batches to avoid overwhelming the system
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    
    console.log(`📦 [RETRY-BATCH] Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} items)`)
    
    const results = await Promise.allSettled(
      batch.map(async (item) => {
        try {
          const result = await retryWithBackoff(
            () => processFn(item),
            options.retryConfig,
            `Batch item ${i + batch.indexOf(item) + 1}`
          )
          
          if (options.onItemSuccess) {
            options.onItemSuccess(item, result)
          }
          
          return result
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          
          if (options.onItemFailure) {
            options.onItemFailure(item, err)
          }
          
          throw err
        }
      })
    )
    
    // Collect successes and failures
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successes.push(result.value)
      } else {
        failures.push({
          item: batch[index],
          error: result.reason instanceof Error ? result.reason : new Error(String(result.reason))
        })
      }
    })
    
    // Add small delay between batches
    if (i + batchSize < items.length) {
      await sleep(1000) // 1 second between batches
    }
  }
  
  console.log(`✅ [RETRY-BATCH] Complete: ${successes.length} succeeded, ${failures.length} failed`)
  
  return { successes, failures }
}
