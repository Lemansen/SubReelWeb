import { NextResponse } from "next/server";
import {
  buildCurseForgeErrorResponse,
  curseforgeFetch,
  getOptionalNumberParam,
  getOptionalStringParam,
} from "@/lib/curseforge";

const MINECRAFT_GAME_ID = 432;

export async function GET(request: Request) {
  try {
    const searchFilter = getOptionalStringParam(request, "searchFilter");
    const gameVersion = getOptionalStringParam(request, "gameVersion");
    const sortField = getOptionalNumberParam(request, "sortField");
    const sortOrder = getOptionalStringParam(request, "sortOrder");
    const modLoaderType = getOptionalNumberParam(request, "modLoaderType");
    const classId = getOptionalNumberParam(request, "classId");
    const categoryId = getOptionalNumberParam(request, "categoryId");
    const index = getOptionalNumberParam(request, "index");
    const pageSize = getOptionalNumberParam(request, "pageSize") ?? 20;

    const data = await curseforgeFetch("/mods/search", {
      gameId: MINECRAFT_GAME_ID,
      searchFilter,
      gameVersion,
      sortField,
      sortOrder,
      modLoaderType,
      classId,
      categoryId,
      index,
      pageSize,
    });

    return NextResponse.json(data);
  } catch (error) {
    const payload = buildCurseForgeErrorResponse(error);
    return NextResponse.json(payload, { status: payload.status ?? 500 });
  }
}
