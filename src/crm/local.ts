import { promises as fs } from "node:fs";
import path from "node:path";
import type { CrmLeadRecord, CrmProvider } from "./provider.js";

/** Append-only JSON-lines CRM. Zero dependencies, ideal for demos and CI. */
export class LocalJsonCrm implements CrmProvider {
  readonly name = "local";

  constructor(private readonly filePath: string) {}

  async write(record: CrmLeadRecord): Promise<{ id: string; provider: string }> {
    const dir = path.dirname(path.resolve(this.filePath));
    await fs.mkdir(dir, { recursive: true });
    await fs.appendFile(path.resolve(this.filePath), JSON.stringify(record) + "\n", "utf8");
    return { id: record.lead.id, provider: this.name };
  }
}
