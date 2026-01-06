// Backoff Retry - Retry logic with exponential backoff

import { RetryConfig } from '../types';

interface RetryState {
  attempt: number;
  last_attempt_at?: Date;
  next_retry_at?: Date;
  errors: Array<{ attempt: number; error: string; timestamp: Date }>;
  status: 'pending' | 'retrying' | 'succeeded' | 'exhausted';
}

interface RetryResult<T> {
  success: boolean;
  result?: T;
  attempts: number;
  total_time_ms: number;
  final_error?: string;
}

class BackoffRetryService {
  private retryStates: Map<string, RetryState> = new Map();
  private defaultConfig: RetryConfig = {
    max_attempts: 3,
    backoff_type: 'exponential',
    initial_delay_ms: 1000,
    max_delay_ms: 30000,
  };

  async executeWithRetry<T>(
    operationId: string,
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<RetryResult<T>> {
    const retryConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();

    let state = this.retryStates.get(operationId);
    if (!state) {
      state = {
        attempt: 0,
        errors: [],
        status: 'pending',
      };
      this.retryStates.set(operationId, state);
    }

    while (state.attempt < retryConfig.max_attempts) {
      state.attempt++;
      state.status = 'retrying';
      state.last_attempt_at = new Date();

      try {
        const result = await operation();
        
        state.status = 'succeeded';
        this.retryStates.delete(operationId);

        return {
          success: true,
          result,
          attempts: state.attempt,
          total_time_ms: Date.now() - startTime,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        state.errors.push({
          attempt: state.attempt,
          error: errorMessage,
          timestamp: new Date(),
        });

        console.log(`[Retry] Attempt ${state.attempt}/${retryConfig.max_attempts} failed: ${errorMessage}`);

        if (state.attempt < retryConfig.max_attempts) {
          const delay = this.calculateDelay(state.attempt, retryConfig);
          state.next_retry_at = new Date(Date.now() + delay);
          
          console.log(`[Retry] Waiting ${delay}ms before retry`);
          await this.sleep(delay);
        }
      }
    }

    state.status = 'exhausted';
    const finalError = state.errors[state.errors.length - 1]?.error || 'Unknown error';

    return {
      success: false,
      attempts: state.attempt,
      total_time_ms: Date.now() - startTime,
      final_error: finalError,
    };
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay: number;

    switch (config.backoff_type) {
      case 'fixed':
        delay = config.initial_delay_ms;
        break;
      
      case 'linear':
        delay = config.initial_delay_ms * attempt;
        break;
      
      case 'exponential':
      default:
        delay = config.initial_delay_ms * Math.pow(2, attempt - 1);
        break;
    }

    // Add jitter (±10%)
    const jitter = delay * 0.1 * (Math.random() * 2 - 1);
    delay += jitter;

    // Cap at max delay
    return Math.min(delay, config.max_delay_ms);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getRetryState(operationId: string): RetryState | undefined {
    return this.retryStates.get(operationId);
  }

  clearRetryState(operationId: string): void {
    this.retryStates.delete(operationId);
  }

  getAllRetryStates(): Map<string, RetryState> {
    return new Map(this.retryStates);
  }

  // Create a retryer function that wraps an operation
  createRetryer<T>(
    config: Partial<RetryConfig> = {}
  ): (operationId: string, operation: () => Promise<T>) => Promise<RetryResult<T>> {
    return (operationId: string, operation: () => Promise<T>) => 
      this.executeWithRetry(operationId, operation, config);
  }

  // Circuit breaker pattern
  private circuitBreakers: Map<string, {
    failures: number;
    last_failure: Date;
    state: 'closed' | 'open' | 'half-open';
  }> = new Map();

  private circuitBreakerConfig = {
    failure_threshold: 5,
    reset_timeout_ms: 60000,
  };

  isCircuitOpen(serviceId: string): boolean {
    const breaker = this.circuitBreakers.get(serviceId);
    if (!breaker) return false;

    if (breaker.state === 'open') {
      // Check if we should try half-open
      const timeSinceFailure = Date.now() - breaker.last_failure.getTime();
      if (timeSinceFailure >= this.circuitBreakerConfig.reset_timeout_ms) {
        breaker.state = 'half-open';
        return false;
      }
      return true;
    }

    return false;
  }

  recordSuccess(serviceId: string): void {
    const breaker = this.circuitBreakers.get(serviceId);
    if (breaker) {
      breaker.failures = 0;
      breaker.state = 'closed';
    }
  }

  recordFailure(serviceId: string): void {
    let breaker = this.circuitBreakers.get(serviceId);
    if (!breaker) {
      breaker = { failures: 0, last_failure: new Date(), state: 'closed' };
      this.circuitBreakers.set(serviceId, breaker);
    }

    breaker.failures++;
    breaker.last_failure = new Date();

    if (breaker.failures >= this.circuitBreakerConfig.failure_threshold) {
      breaker.state = 'open';
      console.log(`[Circuit Breaker] Circuit opened for service: ${serviceId}`);
    }
  }

  getCircuitState(serviceId: string): 'closed' | 'open' | 'half-open' {
    return this.circuitBreakers.get(serviceId)?.state || 'closed';
  }

  setDefaultConfig(config: Partial<RetryConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  setCircuitBreakerConfig(config: Partial<typeof this.circuitBreakerConfig>): void {
    this.circuitBreakerConfig = { ...this.circuitBreakerConfig, ...config };
  }
}

export const backoffRetryService = new BackoffRetryService();
