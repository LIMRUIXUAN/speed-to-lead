import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Durable, thread-safe key/value store backed by a JSON file with atomic writes.
 * Used to make lead processing idempotent across server restarts: replaying a
 * known key returns the previously persisted outcome instead of re-calling.
 */
export class JsonFileStore {
  private cache: Map<string, unknown> | null = null;
  private writeLock: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  async get(key: string): Promise<unknown | undefined> {
    const cache = await this.load();
    return cache.get(key);
  }

  async set(key: string, value: unknown): Promise<void> {
    const cache = await this.load();
    cache.set(key, value);
    await this.persist(cache);
  }

  async list(limit = 50): Promise<{ key: string; value: unknown }[]> {
    const cache = await this.load();
    const entries = Array.from(cache.entries()).map(([key, value]) => ({ key, value }));
    return entries.slice(-limit).reverse();
  }

  private async load(): Promise<Map<string, unknown>> {
    if (this.cache) return this.cache;
    try {
      const raw = await fs.readFile(path.resolve(this.filePath), "utf8");
      const parsed: unknown = JSON.parse(raw);
      this.cache =
        parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? new Map(Object.entries(parsed))
          : new Map();
    } catch {
      this.cache = new Map();
    }
    return this.cache;
  }

  private async persist(cache: Map<string, unknown>): Promise<void> {
    // Chain write operations sequentially to prevent race conditions.
    this.writeLock = this.writeLock.then(async () => {
      const targetPath = path.resolve(this.filePath);
      const dir = path.dirname(targetPath);
      await fs.mkdir(dir, { recursive: true });
      const tempPath = path.join(dir, `.tmp-${randomUUID()}.json`);
      const payload = JSON.stringify(Object.fromEntries(cache), null, 2);
      await fs.writeFile(tempPath, payload, "utf8");
      await fs.rename(tempPath, targetPath);
    });
    return this.writeLock;
  }
}
