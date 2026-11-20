/*
 * Whether the signed-in account may use AI, from its access token. The custom access-token hook
 * (MDI-440) adds `account_status`; the LLM service refuses a token whose status is not `active`
 * with 401 "AI features are not available for this account." The web reads the same claim so it
 * does not offer AI the service would refuse. A token without the claim (the hook is off) is not
 * refused here: the service has the last word.
 */

function payload(token: string): Record<string, unknown> | null {
  const part = token.split('.')[1];
  if (!part) {
    return null;
  }
  try {
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
    const parsed: unknown = JSON.parse(atob(base64));
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function aiAccessFromToken(token: string | null | undefined): boolean {
  if (!token) {
    return false;
  }
  const claims = payload(token);
  if (!claims) {
    return false;
  }
  return claims.account_status === undefined || claims.account_status === 'active';
}
