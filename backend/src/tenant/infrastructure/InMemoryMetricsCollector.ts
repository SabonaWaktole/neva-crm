import { IMetricsCollector, SystemMetricsSnapshot } from '../application/ports/IMetricsCollector';

const WINDOW_SECONDS = 60;
const BUCKET_COUNT = 8;
const BUCKET_SPAN_SECONDS = 5;

interface SecondSlot {
  second: number;
  count: number;
  totalDurationMs: number;
}

/**
 * Per-process request timing, kept in a 60-slot ring buffer keyed by wall-clock
 * second. Nothing here is persisted or shared across instances: a restart or a
 * second process simply starts a fresh window, which is fine for a live
 * "traffic right now" panel and not something a dashboard reload needs to survive.
 */
export class InMemoryMetricsCollector implements IMetricsCollector {
  private readonly slots: SecondSlot[] = Array.from({ length: WINDOW_SECONDS }, () => ({
    second: -1,
    count: 0,
    totalDurationMs: 0,
  }));

  recordRequest(durationMs: number): void {
    const nowSecond = Math.floor(Date.now() / 1000);
    const slot = this.slots[nowSecond % WINDOW_SECONDS];
    if (slot.second !== nowSecond) {
      slot.second = nowSecond;
      slot.count = 0;
      slot.totalDurationMs = 0;
    }
    slot.count += 1;
    slot.totalDurationMs += durationMs;
  }

  getSnapshot(): SystemMetricsSnapshot {
    const nowSecond = Math.floor(Date.now() / 1000);

    const isRecent = (slot: SecondSlot, withinSeconds: number): boolean =>
      slot.second >= 0 && nowSecond - slot.second < withinSeconds;

    const windowSlots = this.slots.filter((slot) => isRecent(slot, WINDOW_SECONDS));
    const totalCount = windowSlots.reduce((sum, slot) => sum + slot.count, 0);
    const totalDurationMs = windowSlots.reduce((sum, slot) => sum + slot.totalDurationMs, 0);
    const avgLatencyMs = totalCount > 0 ? Math.round(totalDurationMs / totalCount) : 0;

    const last10sCount = this.slots.filter((slot) => isRecent(slot, 10)).reduce((sum, slot) => sum + slot.count, 0);
    const requestsPerSecond = Math.round((last10sCount / 10) * 10) / 10;

    const buckets: number[] = [];
    for (let i = BUCKET_COUNT - 1; i >= 0; i--) {
      const bucketStart = nowSecond - (i + 1) * BUCKET_SPAN_SECONDS;
      const bucketEnd = nowSecond - i * BUCKET_SPAN_SECONDS;
      const bucketCount = this.slots
        .filter((slot) => slot.second > bucketStart && slot.second <= bucketEnd)
        .reduce((sum, slot) => sum + slot.count, 0);
      buckets.push(bucketCount);
    }

    return { avgLatencyMs, requestsPerSecond, buckets };
  }
}
