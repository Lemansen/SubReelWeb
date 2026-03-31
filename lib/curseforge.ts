const CURSEFORGE_API_BASE =
  process.env.CURSEFORGE_API_BASE ?? "https://api.curseforge.com/v1";

type QueryValue = string | number | boolean | null | undefined;

type CurseForgeProxyError = Error & {
  status?: number;
  payload?: unknown;
  rawText?: string;
  url?: string;
};

function getApiKey(): string {
  const apiKey =
    process.env.CURSEFORGE_API_KEY ?? process.env.CURSEFORGE_API_TOKEN;

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

function tryParseJson(text: string): unknown {
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
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
      Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  const rawText = await response.text();
  const payload = tryParseJson(rawText);

  if (!response.ok) {
    console.error("[curseforge-proxy] request failed", {
      url,
      status: response.status,
      rawText: rawText.slice(0, 500),
    });

    const error = new Error(
      `CurseForge request failed with status ${response.status}`,
    ) as CurseForgeProxyError;
    error.status = response.status;
    error.payload = payload;
    error.rawText = rawText;
    error.url = url;
    throw error;
  }

  if (payload === null) {
    console.error("[curseforge-proxy] non-json response", {
      url,
      status: response.status,
      rawText: rawText.slice(0, 500),
    });

    const error = new Error(
      "CurseForge returned a non-JSON response",
    ) as CurseForgeProxyError;
    error.status = response.status;
    error.rawText = rawText;
    error.url = url;
    throw error;
  }

  return payload as T;
}

export function buildCurseForgeErrorResponse(error: unknown) {
  const fallbackMessage = "Unknown CurseForge proxy error";

  if (!(error instanceof Error)) {
    return {
      ok: false,
      error: fallbackMessage,
    };
  }

  const proxyError = error as CurseForgeProxyError;
  return {
    ok: false,
    error: proxyError.message,
    status: proxyError.status ?? 500,
    url: proxyError.url ?? null,
    rawText: proxyError.rawText?.slice(0, 500) ?? null,
    payload: proxyError.payload ?? null,
  };
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
