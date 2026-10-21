const DEFAULT_API_ORIGIN = "http://localhost:4000";

/**
 * Returns the configured backend base URL without trailing slashes.
 * The base may intentionally include a reverse-proxy prefix such as `/api`;
 * request paths separately include the Express `/api` route prefix.
 */
export function getApiBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    DEFAULT_API_ORIGIN;

  return configured.trim().replace(/\/+$/, "");
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}
