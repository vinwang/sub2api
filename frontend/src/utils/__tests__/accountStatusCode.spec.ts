import { describe, expect, it } from 'vitest'

import { parseStatusCodeFromErrorMessage } from '@/utils/accountStatusCode'

describe('parseStatusCodeFromErrorMessage', () => {
  it('prefers inner token refresh status over outer wrapped code', () => {
    const message = 'Token refresh failed (non-retryable): code=502 reason="OPENAI_OAUTH_TOKEN_REFRESH_FAILED" message="token refresh failed: status 401, body: {\\"error\\":{\\"message\\":\\"Your refresh token has already been used\\",\\"code\\":\\"refresh_token_reused\\"}}"'

    expect(parseStatusCodeFromErrorMessage(message)).toBe(401)
  })
})
