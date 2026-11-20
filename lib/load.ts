export type Loaded<T> = { ok: true; value: T } | { ok: false };

function rethrowNextError(error: unknown) {
  if (typeof error === "object" && error !== null && "digest" in error) {
    throw error;
  }
}

export async function load<T>(fn: () => Promise<T>): Promise<Loaded<T>> {
  try {
    return { ok: true, value: await fn() };
  } catch (error) {
    rethrowNextError(error);
    console.error(error instanceof Error ? error.message : "request failed");
    return { ok: false };
  }
}
