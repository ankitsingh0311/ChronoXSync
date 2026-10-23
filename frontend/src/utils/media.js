/**
 * ChronoSync - Media URL Resolver
 * Resolves relative media paths (e.g., /uploads/avatars/...) to full absolute backend URLs.
 */
export function getMediaUrl(url) {
  if (!url) return null;
  const strUrl = String(url).trim();
  if (!strUrl) return null;

  if (
    strUrl.startsWith('http://') ||
    strUrl.startsWith('https://') ||
    strUrl.startsWith('data:') ||
    strUrl.startsWith('blob:')
  ) {
    return strUrl;
  }

  const backendBase = import.meta.env.VITE_API_URL || 'https://chronoxsync.onrender.com';
  const cleanBase = backendBase.endsWith('/') ? backendBase.slice(0, -1) : backendBase;
  const cleanPath = strUrl.startsWith('/') ? strUrl : `/${strUrl}`;
  return `${cleanBase}${cleanPath}`;
}
