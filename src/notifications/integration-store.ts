import { promises as fs } from "node:fs";
import path from "node:path";
import type { Config } from "../config.js";

export interface SlackIntegrationData {
  connected: boolean;
  webhookUrl?: string;
  channel?: string;
  teamName?: string;
  clientId?: string;
  clientSecret?: string;
  disconnected?: boolean;
  updatedAt?: string;
}

export interface TwilioIntegrationData {
  connected: boolean;
  accountSid?: string;
  authToken?: string;
  phoneNumber?: string;
  disconnected?: boolean;
  updatedAt?: string;
}

export interface CustomWebhookData {
  connected: boolean;
  url?: string;
  secret?: string;
  label?: string;
  disconnected?: boolean;
  updatedAt?: string;
}

export interface IntegrationsState {
  slack?: SlackIntegrationData;
  twilio?: TwilioIntegrationData;
  webhook?: CustomWebhookData;
}

const DEFAULT_INTEGRATIONS_FILE = "./data/integrations.json";

export class IntegrationsStore {
  constructor(private readonly filePath: string = DEFAULT_INTEGRATIONS_FILE) {}

  private async ensureDir(): Promise<void> {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
  }

  async getAll(): Promise<IntegrationsState> {
    try {
      const data = await fs.readFile(this.filePath, "utf-8");
      return JSON.parse(data) as IntegrationsState;
    } catch {
      return {};
    }
  }

  async saveAll(state: IntegrationsState): Promise<void> {
    await this.ensureDir();
    await fs.writeFile(this.filePath, JSON.stringify(state, null, 2), "utf-8");
  }

  async getSlack(config: Partial<Config>): Promise<SlackIntegrationData> {
    const state = await this.getAll();
    if (state.slack?.disconnected === true) {
      return { connected: false, disconnected: true };
    }
    if (state.slack?.webhookUrl) {
      return state.slack;
    }
    if (config.slackWebhookUrl) {
      return {
        connected: true,
        webhookUrl: config.slackWebhookUrl,
        channel: "#speed-to-lead",
        updatedAt: new Date().toISOString(),
      };
    }
    return { connected: false };
  }

  async saveSlack(data: Partial<SlackIntegrationData>): Promise<void> {
    const state = await this.getAll();
    state.slack = {
      ...state.slack,
      ...data,
      connected: Boolean(data.webhookUrl || state.slack?.webhookUrl),
      disconnected: false,
      updatedAt: new Date().toISOString(),
    };
    await this.saveAll(state);
  }

  async clearSlack(): Promise<void> {
    const state = await this.getAll();
    state.slack = {
      connected: false,
      disconnected: true,
      updatedAt: new Date().toISOString(),
    };
    await this.saveAll(state);
  }

  async getTwilio(config: Partial<Config>): Promise<TwilioIntegrationData> {
    const state = await this.getAll();
    if (state.twilio?.disconnected === true) {
      return { connected: false, disconnected: true };
    }
    if (state.twilio?.accountSid && state.twilio?.authToken && state.twilio?.phoneNumber) {
      return state.twilio;
    }
    if (config.twilioAccountSid && config.twilioAuthToken && config.twilioPhoneNumber) {
      return {
        connected: true,
        accountSid: config.twilioAccountSid,
        authToken: config.twilioAuthToken,
        phoneNumber: config.twilioPhoneNumber,
        updatedAt: new Date().toISOString(),
      };
    }
    return { connected: false };
  }

  async saveTwilio(data: Partial<TwilioIntegrationData>): Promise<void> {
    const state = await this.getAll();
    const sid = data.accountSid || state.twilio?.accountSid;
    const token = data.authToken || state.twilio?.authToken;
    const phone = data.phoneNumber || state.twilio?.phoneNumber;

    state.twilio = {
      ...state.twilio,
      ...data,
      connected: Boolean(sid && token && phone),
      disconnected: false,
      updatedAt: new Date().toISOString(),
    };
    await this.saveAll(state);
  }

  async clearTwilio(): Promise<void> {
    const state = await this.getAll();
    state.twilio = {
      connected: false,
      disconnected: true,
      updatedAt: new Date().toISOString(),
    };
    await this.saveAll(state);
  }

  async getWebhook(): Promise<CustomWebhookData> {
    const state = await this.getAll();
    if (state.webhook?.disconnected === true) {
      return { connected: false, disconnected: true };
    }
    if (state.webhook?.url) {
      return state.webhook;
    }
    return { connected: false };
  }

  async saveWebhook(data: Partial<CustomWebhookData>): Promise<void> {
    const state = await this.getAll();
    state.webhook = {
      ...state.webhook,
      ...data,
      connected: Boolean(data.url || state.webhook?.url),
      disconnected: false,
      updatedAt: new Date().toISOString(),
    };
    await this.saveAll(state);
  }

  async clearWebhook(): Promise<void> {
    const state = await this.getAll();
    state.webhook = {
      connected: false,
      disconnected: true,
      updatedAt: new Date().toISOString(),
    };
    await this.saveAll(state);
  }
}

export const integrationsStore = new IntegrationsStore();

