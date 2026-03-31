import { NextResponse } from "next/server";
import {
  buildCurseForgeErrorResponse,
  curseforgeFetch,
  getOptionalNumberParam,
  getOptionalStringParam,
} from "@/lib/curseforge";

type RouteContext = {
  params: Promise<{
    modId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
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
    const gameVersion = getOptionalStringParam(request, "gameVersion");
    const modLoaderType = getOptionalNumberParam(request, "modLoaderType");
    const index = getOptionalNumberParam(request, "index");
    const pageSize = getOptionalNumberParam(request, "pageSize") ?? 20;

    const data = await curseforgeFetch(`/mods/${numericId}/files`, {
      gameVersion,
      modLoaderType,
      index,
      pageSize,
    });

    return NextResponse.json(data);
  } catch (error) {
    const payload = buildCurseForgeErrorResponse(error);
    return NextResponse.json(payload, { status: payload.status ?? 500 });
  }
}
