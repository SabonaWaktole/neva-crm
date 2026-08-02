export interface SystemMetricsSnapshot {
  /** Average response time in milliseconds over the last 60s of traffic. */
  avgLatencyMs: number;
  /** Requests per second, averaged over the last 10s. */
  requestsPerSecond: number;
  /** Request counts for the last 8 buckets (5s each), oldest first, for the traffic chart. */
  buckets: number[];
}

/** Tracks live request timing for the System Health panel's latency/traffic figures. */
export interface IMetricsCollector {
  recordRequest(durationMs: number): void;
  getSnapshot(): SystemMetricsSnapshot;
}
