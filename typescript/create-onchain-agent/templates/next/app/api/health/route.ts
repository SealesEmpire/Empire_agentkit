import { NextResponse } from "next/server";
import { getMissingRequiredEnv, getRuntimeConfig } from "@/app/lib/server/runtime-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const config = getRuntimeConfig();
  const missingEnv = getMissingRequiredEnv(["OPENAI_API_KEY"]);

  return NextResponse.json(
    {
      deploymentTarget: config.deploymentTarget,
      empireKnowledgeCoreEnabled: config.empireKnowledgeCoreEnabled,
      fileWalletStorageEnabled: config.enableFileWalletStorage,
      model: config.openAiModel,
      status: missingEnv.length === 0 ? "ok" : "degraded",
      missingEnv,
    },
    { status: missingEnv.length === 0 ? 200 : 503 },
  );
}
