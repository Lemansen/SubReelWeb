export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error(
      "Supabase env is missing. Expected NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return { url, anonKey };
}

export function tryGetSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function getSupabaseServiceRoleKey() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!serviceRoleKey) {
    throw new Error("Supabase service role env is missing. Expected SUPABASE_SERVICE_ROLE_KEY.");
  }

  return serviceRoleKey;
}

export function sanitizeLauncherRedirect(input: string | null | undefined) {
  const fallback = new URL("http://localhost:25555/callback");
  const raw = input?.trim();

  if (!raw) {
    return fallback.toString();
  }

  let parsed: URL;

  try {
    parsed = new URL(raw);
  } catch {
    return fallback.toString();
  }

  const isLoopbackHost =
    parsed.hostname === "localhost" ||
    parsed.hostname === "127.0.0.1" ||
    parsed.hostname === "[::1]";

  if (parsed.protocol !== "http:" || !isLoopbackHost) {
    return fallback.toString();
  }

  if (!parsed.pathname || parsed.pathname === "/") {
    parsed.pathname = "/callback";
  }

  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
}
