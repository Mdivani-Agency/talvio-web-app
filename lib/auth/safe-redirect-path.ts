const FALLBACK_PATH = '/account';
const LOCAL_BASE = 'http://localhost';

function decodeRedirectPath(raw: string) {
  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}

export function safeRedirectPath(raw: string | null, fallback = FALLBACK_PATH) {
  if (!raw) {
    return fallback;
  }

  const decoded = decodeRedirectPath(raw);
  if (!decoded || !decoded.startsWith('/') || /^\/[\/\\]/.test(decoded)) {
    return fallback;
  }

  try {
    const url = new URL(decoded, LOCAL_BASE);
    if (url.origin !== LOCAL_BASE) {
      return fallback;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function publicRequestOrigin(request: Request) {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (forwardedHost) {
    return `${forwardedProto ?? 'https'}://${forwardedHost}`;
  }
  return new URL(request.url).origin;
}

export function sameOriginRedirect(path: string, origin: string) {
  const target = new URL(path, origin);
  if (target.origin !== origin) {
    return new URL(FALLBACK_PATH, origin);
  }
  return target;
}
