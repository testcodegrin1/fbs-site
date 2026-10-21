const DEFAULT_API_ORIGIN = "http://localhost:4000";

/**
 * Returns the backend origin without an API route prefix.
 * Request paths already start with `/api`, so both an origin-only setting and
 * a setting ending in `/api` resolve to a URL containing exactly one `/api`.
 */
export function getApiBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    DEFAULT_API_ORIGIN;

  return configured.trim().replace(/\/+$/, "").replace(/\/api$/i, "");
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}
