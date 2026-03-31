import { NextResponse } from "next/server";
import {
  buildCurseForgeErrorResponse,
  curseforgeUploadFetch,
} from "@/lib/curseforge";

export async function GET() {
  try {
    const data = await curseforgeUploadFetch("/game/dependencies");
    return NextResponse.json(data);
  } catch (error) {
    const payload = buildCurseForgeErrorResponse(error);
    return NextResponse.json(payload, { status: payload.status ?? 500 });
  }
}
