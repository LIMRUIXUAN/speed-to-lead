export interface Metrics {
  leads_total: number;
  leads_replayed: number;
  leads_failed: number;
}

export const metrics: Metrics = {
  leads_total: 0,
  leads_replayed: 0,
  leads_failed: 0,
};

export function increment(key: keyof Metrics): void {
  metrics[key] += 1;
}
