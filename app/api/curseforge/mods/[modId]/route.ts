import { NextResponse } from "next/server";
import { curseforgeFetch } from "@/lib/curseforge";

type RouteContext = {
  params: Promise<{
    modId: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { modId } = await context.params;
  const numericId = Number(modId);

  if (!Number.isFinite(numericId)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid modId",
      },
      { status: 400 },
    );
  }

  try {
    const data = await curseforgeFetch(`/mods/${numericId}`);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown CurseForge proxy error";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
