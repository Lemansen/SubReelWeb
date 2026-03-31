import { NextResponse } from "next/server";
import {
  buildCurseForgeErrorResponse,
  curseforgeFetch,
} from "@/lib/curseforge";

const MINECRAFT_GAME_ID = 432;

export async function GET() {
  try {
    const data = await curseforgeFetch(
      `/games/${MINECRAFT_GAME_ID}/version-types`,
    );
    return NextResponse.json(data);
  } catch (error) {
    const payload = buildCurseForgeErrorResponse(error);
    return NextResponse.json(payload, { status: payload.status ?? 500 });
  }
}
