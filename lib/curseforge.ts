const CURSEFORGE_API_BASE = "https://api.curseforge.com/v1";

type QueryValue = string | number | boolean | null | undefined;

function getApiKey(): string {
  const apiKey = process.env.CURSEFORGE_API_KEY;
  if (!apiKey) {
    throw new Error("CURSEFORGE_API_KEY is not configured");
  }

  return apiKey;
}

function buildQuery(params: Record<string, QueryValue>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  return searchParams.toString();
}

export async function curseforgeFetch<T>(
  path: string,
  params?: Record<string, QueryValue>,
): Promise<T> {
  const query = params ? buildQuery(params) : "";
  const url = `${CURSEFORGE_API_BASE}${path}${query ? `?${query}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": getApiKey(),
      Accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as T) : ({} as T);

  if (!response.ok) {
    const error = new Error(`CurseForge request failed with status ${response.status}`);
    (error as Error & { payload?: unknown }).payload = payload;
    throw error;
  }

  return payload;
}

export function getRequiredNumberParam(
  request: Request,
  name: string,
): number | null {
  const value = new URL(request.url).searchParams.get(name);
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getOptionalNumberParam(
  request: Request,
  name: string,
): number | undefined {
  const value = new URL(request.url).searchParams.get(name);
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function getOptionalStringParam(
  request: Request,
  name: string,
): string | undefined {
  const value = new URL(request.url).searchParams.get(name);
  return value && value.trim() ? value.trim() : undefined;
}
