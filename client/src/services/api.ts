const configuredApiBase = (import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/+$/, '') ?? '';

/** VITE_API_URL is the backend origin (for example, https://api.example.com).
 * When unset, same-origin /api requests use the Vite proxy in development and
 * the Express host in production.
 */
export function apiUrl(path: string): string {
  const apiPath = path.startsWith('/') ? path : `/${path}`;
  return `${configuredApiBase}${apiPath}`;
}

async function errorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      const body: unknown = await response.json();
      if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') return body.error;
      if (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string') return body.message;
    } catch {
      // A malformed error body should still produce a useful HTTP error.
    }
  } else {
    try {
      const text = (await response.text()).trim();
      if (text) return `The server returned a non-JSON error: ${text.slice(0, 160)}`;
    } catch {
      // Fall through to the status-based message.
    }
  }
  return `Request failed (HTTP ${response.status}). Check that the API server is available.`;
}

/** Fetch JSON safely: check status before parsing, and turn network/HTML/invalid JSON errors into readable errors. */
export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(apiUrl(path), init);
  } catch {
    throw new Error('Could not reach the API server. Check its address and try again.');
  }

  if (!response.ok) throw new Error(await errorMessage(response));
  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error(`The API returned a non-JSON response (HTTP ${response.status}). Check the API URL and route.`);
  }
  try {
    return await response.json() as T;
  } catch {
    throw new Error('The API returned invalid JSON. Please retry or check the server response.');
  }
}
