import { promises as fs } from "node:fs";
import path from "node:path";

type Json = Record<string, unknown> | unknown[];

// Cola simple para serializar escrituras y evitar corrupción
const writeQueues = new Map<string, Promise<void>>();

function resolveDataPath(fileName: string) {
  // apps/api/src/persistence -> apps/api
  const apiRoot = path.resolve(process.cwd());
  return path.join(apiRoot, "data", fileName);
}

export async function readJson<T>(fileName: string, fallback: T): Promise<T> {
  const filePath = resolveDataPath(fileName);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch (e: any) {
    if (e?.code === "ENOENT") {
      await ensureDirAndFile(filePath, fallback as unknown as Json);
      return fallback;
    }
    // JSON corrupto o error inesperado
    throw e;
  }
}

export async function writeJson<T>(fileName: string, data: T): Promise<void> {
  const filePath = resolveDataPath(fileName);

  // Encolar por archivo
  const prev = writeQueues.get(filePath) ?? Promise.resolve();

  const next = prev
    .catch(() => {}) // no romper cadena si una escritura falló
    .then(async () => {
      await ensureDir(path.dirname(filePath));
      const tmp = `${filePath}.tmp`;
      const json = JSON.stringify(data, null, 2);

      // write -> rename (más seguro)
      await fs.writeFile(tmp, json, "utf-8");
      await fs.rename(tmp, filePath);
    });

  writeQueues.set(filePath, next);
  await next;
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function ensureDirAndFile(filePath: string, data: Json) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}
