import { readFile, writeFile } from "fs/promises";
import { getRuntimeConfig } from "@/app/lib/server/runtime-config";

export async function loadPersistedWalletData(filePath: string): Promise<string | null> {
  const config = getRuntimeConfig();
  if (config.walletData) {
    return config.walletData;
  }

  if (!config.enableFileWalletStorage) {
    return null;
  }

  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
      console.error("Error reading wallet data:", error);
    }

    return null;
  }
}

export async function persistWalletData(filePath: string, data: string): Promise<void> {
  const config = getRuntimeConfig();
  if (config.walletData || !config.enableFileWalletStorage) {
    return;
  }

  await writeFile(filePath, data);
}
