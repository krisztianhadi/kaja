/** Client-side API helper. Throws Error with the server's error message. */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers:
      init?.body instanceof FormData
        ? init.headers
        : { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (typeof data?.error === "string") message = data.error;
    } catch {
      // keep generic message
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

/** Client-local UTC offset in minutes (Date.getTimezoneOffset). */
export function tzOffsetMinutes(): number {
  return new Date().getTimezoneOffset();
}
