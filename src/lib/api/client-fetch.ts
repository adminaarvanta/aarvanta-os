export async function apiFetch<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  try {
    const response = await fetch(input, init);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        data?.error?.message ??
        data?.error ??
        `Request failed (${response.status})`;
      return { ok: false, message: String(message) };
    }

    return { ok: true, data: data as T };
  } catch {
    return { ok: false, message: "Network error — please try again." };
  }
}
