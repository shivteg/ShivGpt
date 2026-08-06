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

// In-memory store for user token usage records
const userQuotaStore = new Map<string, UserQuotaRecord>();

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
    console.log(`[RateLimit] User ${normalizedEmail} exceeded limit (${record.usedTokens}/${HOURLY_TOKEN_LIMIT} tokens). Sending warning email.`);
    sendRateLimitExceededEmail(normalizedEmail).catch((err) =>
      console.error(`[RateLimit] Failed to send rate limit exceeded email to ${normalizedEmail}:`, err)
    );

    // 2. Schedule email after 1 hour (when wait is finished): "Finally wait is over now use SAI link- shiv-gpt-two.vercel.app"
    const timeUntilResetMs = Math.max(1000, record.resetAt - now);
    console.log(`[RateLimit] Scheduling reset email for ${normalizedEmail} in ${Math.round(timeUntilResetMs / 1000)}s.`);

    if (record.resetTimer) {
      clearTimeout(record.resetTimer);
    }

    record.resetTimer = setTimeout(() => {
      console.log(`[RateLimit] 1-hour wait period complete for ${normalizedEmail}. Sending reset email.`);
      sendRateLimitResetEmail(normalizedEmail).catch((err) =>
        console.error(`[RateLimit] Failed to send rate limit reset email to ${normalizedEmail}:`, err)
      );
    }, timeUntilResetMs);
  }

  return {
    usedTokens: record.usedTokens,
    remainingTokens: Math.max(0, HOURLY_TOKEN_LIMIT - record.usedTokens),
    limit: HOURLY_TOKEN_LIMIT,
    isExceeded: record.usedTokens >= HOURLY_TOKEN_LIMIT,
  };
};
