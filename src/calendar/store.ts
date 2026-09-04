import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { LeadScore } from "../scoring.js";
import type { Qualification } from "../types.js";

export interface StoredBooking {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadEmail?: string;
  leadCompany?: string;
  start: string;
  end: string;
  slotLabel: string;
  provider: string;
  googleCalendarUrl: string;
  status: "booked" | "cancelled" | "completed";
  score?: LeadScore;
  qualification?: Qualification;
  summary?: string;
  createdAt: string;
}

export class BookingsCollectionStore {
  constructor(private readonly filePath: string = "./data/bookings.jsonl") {}

  async append(booking: StoredBooking): Promise<void> {
    try {
      await mkdir(dirname(this.filePath), { recursive: true });
      await appendFile(this.filePath, JSON.stringify(booking) + "\n", "utf-8");
    } catch (err) {
      console.error("[bookings-store] Failed to append booking:", err);
    }
  }

  async list(limit = 100): Promise<StoredBooking[]> {
    try {
      const content = await readFile(this.filePath, "utf-8");
      const lines = content.trim().split("\n").filter(Boolean);
      const items = lines
        .map((line) => {
          try {
            return JSON.parse(line) as StoredBooking;
          } catch {
            return null;
          }
        })
        .filter((item): item is StoredBooking => item !== null);

      return items.reverse().slice(0, limit);
    } catch {
      return [];
    }
  }

  async get(id: string): Promise<StoredBooking | null> {
    const all = await this.list(500);
    return all.find((b) => b.id === id) ?? null;
  }
}

export const bookingsStore = new BookingsCollectionStore();
