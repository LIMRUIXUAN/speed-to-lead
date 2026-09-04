import type { Config } from "../config.js";
import { HubspotCrm } from "./hubspot.js";
import { LocalJsonCrm } from "./local.js";
import type { CrmProvider } from "./provider.js";

export function createCrmProvider(config: Config): CrmProvider {
  if (config.crmProvider === "hubspot") return new HubspotCrm(config.hubspotAccessToken);
  return new LocalJsonCrm(config.crmLocalPath);
}

export type { CrmLeadRecord, CrmProvider } from "./provider.js";
