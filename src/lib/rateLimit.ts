import { sendRateLimitExceededEmail, sendRateLimitResetEmail } from './emailService';

export const HOURLY_TOKEN_LIMIT = 432;
export const ONE_HOUR_MS = 60 * 60 * 1000; // 1 hour in milliseconds

interface UserQuotaRecord {
  usedTokens: number;
  windowStart: number;
  resetAt: number;
  exceededNotified: boolean;
  resetTimer?: NodeJS.Timeout;
}

interface PendingEmailJob {
  userEmail: string;
  resetAt: number;
  sent: boolean;
  createdAt: number;
}

// In-memory stores for user token usage records and pending reset email jobs
const userQuotaStore = new Map<string, UserQuotaRecord>();
const pendingEmailJobs: PendingEmailJob[] = [];

/**
 * Process any pending reset email jobs whose 1-hour wait period has elapsed
 */
export const processPendingResetEmails = async (): Promise<{ processedCount: number }> => {
  const now = Date.now();
  let processedCount = 0;

  for (const job of pendingEmailJobs) {
    if (!job.sent && now >= job.resetAt) {
      job.sent = true;
      processedCount++;
      console.log(`[RateLimit Cron] 1-hour wait completed for ${job.userEmail}. Dispatching reset email.`);
      try {
        await sendRateLimitResetEmail(job.userEmail);
      } catch (err) {
        console.error(`[RateLimit Cron] Error sending reset email to ${job.userEmail}:`, err);
      }
    }
  }

  return { processedCount };
};

/**
 * Clean up expired user records or reset windows
 */
const getOrResetUserRecord = (userEmail: string): UserQuotaRecord => {
  const normalizedEmail = userEmail.toLowerCase().trim();
  const now = Date.now();
  const existing = userQuotaStore.get(normalizedEmail);

  if (!existing || now >= existing.resetAt) {
    if (existing?.resetTimer) {
      clearTimeout(existing.resetTimer);
    }

    const freshRecord: UserQuotaRecord = {
      usedTokens: 0,
      windowStart: now,
      resetAt: now + ONE_HOUR_MS,
      exceededNotified: false,
    };
    userQuotaStore.set(normalizedEmail, freshRecord);
    return freshRecord;
  }

  return existing;
};

/**
 * Check if user is currently rate-limited (has consumed >= 432 tokens in current 1 hr window)
 */
export const checkUserRateLimit = (
  userEmail: string
): {
  allowed: boolean;
  usedTokens: number;
  remainingTokens: number;
  limit: number;
  resetAt: number;
  resetInMinutes: number;
} => {
  // Always check for completed pending email jobs
  processPendingResetEmails().catch(() => {});

  const normalizedEmail = userEmail.toLowerCase().trim();
  const record = getOrResetUserRecord(normalizedEmail);
  const now = Date.now();

  const isExceeded = record.usedTokens >= HOURLY_TOKEN_LIMIT;
  const remainingMs = Math.max(0, record.resetAt - now);
  const resetInMinutes = Math.ceil(remainingMs / 60000);

  return {
    allowed: !isExceeded,
    usedTokens: record.usedTokens,
    remainingTokens: Math.max(0, HOURLY_TOKEN_LIMIT - record.usedTokens),
    limit: HOURLY_TOKEN_LIMIT,
    resetAt: record.resetAt,
    resetInMinutes: resetInMinutes,
  };
};

/**
 * Record token consumption for a user and trigger email alerts if limit (432 tokens/1 hr) is exceeded
 */
export const consumeUserTokens = async (
  userEmail: string,
  tokensConsumed: number
): Promise<{
  usedTokens: number;
  remainingTokens: number;
  limit: number;
  isExceeded: boolean;
}> => {
  const normalizedEmail = userEmail.toLowerCase().trim();
  const record = getOrResetUserRecord(normalizedEmail);
  const now = Date.now();

  record.usedTokens += tokensConsumed;

  if (record.usedTokens >= HOURLY_TOKEN_LIMIT && !record.exceededNotified) {
    record.exceededNotified = true;

    // 1. Send immediate email: "Rate limit exceeded you must try again after 1 hr"
    console.log(`[RateLimit] User ${normalizedEmail} exceeded limit (${record.usedTokens}/${HOURLY_TOKEN_LIMIT} tokens). Sending warning email immediately.`);
    sendRateLimitExceededEmail(normalizedEmail).catch((err) =>
      console.error(`[RateLimit] Failed to send rate limit exceeded email to ${normalizedEmail}:`, err)
    );

    // 2. Queue persistent reset email job for when the 1-hour wait period expires
    const resetTime = record.resetAt;
    pendingEmailJobs.push({
      userEmail: normalizedEmail,
      resetAt: resetTime,
      sent: false,
      createdAt: now,
    });

    const timeUntilResetMs = Math.max(1000, resetTime - now);
    console.log(`[RateLimit] Scheduled reset email for ${normalizedEmail} at ${new Date(resetTime).toISOString()} (in ${Math.round(timeUntilResetMs / 1000)}s).`);

    if (record.resetTimer) {
      clearTimeout(record.resetTimer);
    }

    record.resetTimer = setTimeout(() => {
      console.log(`[RateLimit Timer] 1-hour wait period finished for ${normalizedEmail}. Executing reset email.`);
      processPendingResetEmails().catch(() => {});
    }, timeUntilResetMs);
  }

  return {
    usedTokens: record.usedTokens,
    remainingTokens: Math.max(0, HOURLY_TOKEN_LIMIT - record.usedTokens),
    limit: HOURLY_TOKEN_LIMIT,
    isExceeded: record.usedTokens >= HOURLY_TOKEN_LIMIT,
  };
};

/**
 * Manually trigger or simulate rate limit email events for a specific user (for testing)
 */
export const triggerTestEmailFlow = async (
  userEmail: string,
  type: 'exceeded' | 'reset' | 'both' = 'both'
): Promise<{ exceededSent: boolean; resetSent: boolean }> => {
  const normalizedEmail = userEmail.toLowerCase().trim();
  let exceededSent = false;
  let resetSent = false;

  if (type === 'exceeded' || type === 'both') {
    exceededSent = await sendRateLimitExceededEmail(normalizedEmail);
  }

  if (type === 'reset' || type === 'both') {
    resetSent = await sendRateLimitResetEmail(normalizedEmail);
  }

  return { exceededSent, resetSent };
};
