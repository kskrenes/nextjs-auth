/**
 * Atomically transitions a pending MFA token from "pending" → "claimed".
 * Only one concurrent caller can succeed; subsequent callers receive null.
 * Stores the remaining TTL in the claimed record so it can be restored on failure.
 *
 * Returns userId if the claim succeeded, or null if the token is missing,
 * expired, or already claimed by another request.
 */
export const CLAIM_SCRIPT = `
local key   = KEYS[1]
local claimTTL = tonumber(ARGV[1])
local expectedUserId = ARGV[2]
local val = redis.call('GET', key)
if not val then return nil end
local ok, data = pcall(cjson.decode, val)
if not ok or data.claimed then return nil end
if expectedUserId and expectedUserId ~= '' then
  if data.userId ~= expectedUserId then
    redis.call('DEL', key)
    return nil
  end
end
local ttl = redis.call('TTL', key)
if ttl < 0 then return nil end
data.claimed     = true
data.remainingTTL = ttl
redis.call('SET', key, cjson.encode(data), 'EX', claimTTL)
return val
`;

/**
 * Atomically reverts a claimed token back to "pending", restoring the
 * original TTL so the user can retry without restarting the login flow.
 * No-ops gracefully if the token no longer exists (e.g. claim window expired).
 */
export const UNCLAIM_SCRIPT = `
local key = KEYS[1]
local val = redis.call('GET', key)
if not val then return nil end
local ok, data = pcall(cjson.decode, val)
if not ok or not data.claimed then return nil end
local remainingTTL = data.remainingTTL or 60
data.claimed      = nil
data.remainingTTL = nil
redis.call('SET', key, cjson.encode(data), 'EX', remainingTTL)
return 1
`;

// Short window for validation + session creation; protects against indefinite locks.
export const CLAIM_TTL_SECONDS = 30; 