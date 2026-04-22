import type { Account } from '@/types'

const STATUS_CODE_PATTERN = /\((\d{3})\)|returned\s+(\d{3})|(?:^|\s)(\d{3}):/i
const TOKEN_REFRESH_STATUS_PATTERN = /token refresh failed:\s*status\s*(\d{3})/i

/**
 * Parse a status code from an account error message
 * @param errorMessage Account error message text
 * @returns Parsed HTTP-like status code or null
 */
export const parseStatusCodeFromErrorMessage = (errorMessage: string | null | undefined): number | null => {
  if (!errorMessage) return null
  const refreshStatusMatch = errorMessage.match(TOKEN_REFRESH_STATUS_PATTERN)
  if (refreshStatusMatch?.[1]) {
    const refreshStatusCode = Number.parseInt(refreshStatusMatch[1], 10)
    return Number.isFinite(refreshStatusCode) ? refreshStatusCode : null
  }
  const match = errorMessage.match(STATUS_CODE_PATTERN)
  if (!match) return null

  const rawCode = match[1] || match[2] || match[3]
  const parsed = Number.parseInt(rawCode, 10)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Parse a status code from a temp unschedulable reason payload
 * @param reason Temp unschedulable reason string
 * @returns Parsed status code or null
 */
export const parseStatusCodeFromTempUnschedReason = (reason: string | null | undefined): number | null => {
  if (!reason) return null

  try {
    const parsed = JSON.parse(reason) as { status_code?: unknown }
    const statusCode = Number(parsed.status_code)
    return Number.isFinite(statusCode) && statusCode > 0 ? statusCode : null
  } catch {
    return null
  }
}

/**
 * Resolve the current effective account status code with UI priority
 * @param account Account row data
 * @returns Current effective status code or null
 */
export const resolveAccountStatusCode = (account: Account): number | null => {
  const now = Date.now()
  const hasActiveTempUnsched = !!account.temp_unschedulable_until && new Date(account.temp_unschedulable_until).getTime() > now
  const hasActiveRateLimit = !!account.rate_limit_reset_at && new Date(account.rate_limit_reset_at).getTime() > now
  const hasActiveOverload = !!account.overload_until && new Date(account.overload_until).getTime() > now

  if (account.status === 'error') {
    return parseStatusCodeFromErrorMessage(account.error_message)
  }
  if (hasActiveTempUnsched) {
    return parseStatusCodeFromTempUnschedReason(account.temp_unschedulable_reason)
  }
  if (hasActiveRateLimit) {
    return 429
  }
  if (hasActiveOverload) {
    return 529
  }
  return null
}
