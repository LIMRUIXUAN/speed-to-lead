import { EventEmitter } from "node:events";
import type { FastifyReply } from "fastify";

export type PipelineEventType =
  | "lead:received"
  | "compliance:checked"
  | "call:dialing"
  | "call:connected"
  | "call:turn"
  | "call:analyzing"
  | "booking:confirmed"
  | "crm:synced"
  | "notifications:dispatched"
  | "lead:completed"
  | "lead:failed";

export interface PipelineEvent<T = Record<string, unknown>> {
  id: string;
  type: PipelineEventType;
  timestamp: string;
  leadId?: string;
  callId?: string;
  data: T;
}

export class EventsHub extends EventEmitter {
  private recentEvents: PipelineEvent[] = [];
  private readonly maxRecent: number = 30;
  private activeClients: Set<FastifyReply> = new Set();

  constructor() {
    super();
    // Allow high number of concurrent SSE dashboard listeners without MaxListenersExceededWarning
    this.setMaxListeners(100);
  }

  /**
   * Broadcast an event to all connected SSE clients and cache in recent history.
   */
  emitEvent<T extends Record<string, unknown>>(
    type: PipelineEventType,
    data: T,
    meta?: { leadId?: string; callId?: string },
  ): PipelineEvent<T> {
    const event: PipelineEvent<T> = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      timestamp: new Date().toISOString(),
      leadId: meta?.leadId,
      callId: meta?.callId,
      data,
    };

    this.recentEvents.push(event as PipelineEvent);
    if (this.recentEvents.length > this.maxRecent) {
      this.recentEvents.shift();
    }

    this.emit("pipeline:event", event);

    // Send to all active SSE response streams
    const sseMessage = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
    for (const client of this.activeClients) {
      try {
        client.raw.write(sseMessage);
      } catch {
        this.activeClients.delete(client);
      }
    }

    return event;
  }

  /**
   * Register a Fastify SSE client stream.
   */
  registerClient(reply: FastifyReply): void {
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "X-Accel-Buffering": "no", // Disable buffering in Nginx / Cloud proxies
    });

    // Send initial connected handshake
    reply.raw.write(
      `event: connected\ndata: ${JSON.stringify({
        status: "ok",
        connectedAt: new Date().toISOString(),
        recentCount: this.recentEvents.length,
      })}\n\n`,
    );

    // Replay recent events to quickly hydrate new clients
    for (const ev of this.recentEvents) {
      reply.raw.write(`event: ${ev.type}\ndata: ${JSON.stringify(ev)}\n\n`);
    }

    this.activeClients.add(reply);

    // Heartbeat ping every 20 seconds to keep connection alive through proxies
    const heartbeat = setInterval(() => {
      try {
        reply.raw.write(`: heartbeat ${Date.now()}\n\n`);
      } catch {
        clearInterval(heartbeat);
        this.activeClients.delete(reply);
      }
    }, 20_000);

    reply.raw.on("close", () => {
      clearInterval(heartbeat);
      this.activeClients.delete(reply);
    });
  }

  getRecentEvents(): PipelineEvent[] {
    return [...this.recentEvents];
  }

  getActiveClientCount(): number {
    return this.activeClients.size;
  }

  clearHistory(): void {
    this.recentEvents = [];
  }
}

export const eventsHub = new EventsHub();
