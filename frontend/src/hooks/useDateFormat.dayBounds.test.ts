import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDateFormat } from './useDateFormat';
import { useAuthStore } from '../store/useAuthStore';
import { dayBoundsInZone } from '../utils/tenantDay';

/**
 * `dayBounds` is the primitive TD-029 added so that no component has to reach
 * for `setHours(0,0,0,0)` again. These tests pin the property that made the
 * defect possible: the answer must follow the TENANT's zone, not the browser's.
 */
describe('useDateFormat().dayBounds', () => {
  const setTenantZone = (tenantTimezone: string) => {
    useAuthStore.setState({
      user: {
        userId: 'u1',
        email: 'staff@test',
        role: 'STAFF',
        tenantTimezone,
      } as never,
    });
  };

  beforeEach(() => {
    useAuthStore.setState({ user: null } as never);
  });

  it('resolves the day in the tenant timezone, not the browser one', () => {
    setTenantZone('Asia/Tokyo');
    const { result } = renderHook(() => useDateFormat());

    const bounds = result.current.dayBounds();
    // Delegates to the shared primitive, so the fixture table governs it.
    expect(bounds.start.toISOString()).toBe(dayBoundsInZone('Asia/Tokyo', 0).start.toISOString());
  });

  it('gives different bounds for tenants in different zones at the same moment', () => {
    setTenantZone('Pacific/Kiritimati'); // UTC+14
    const { result: far } = renderHook(() => useDateFormat());
    const farStart = far.current.dayBounds().start.getTime();

    setTenantZone('Pacific/Niue'); // UTC-11
    const { result: near } = renderHook(() => useDateFormat());
    const nearStart = near.current.dayBounds().start.getTime();

    // The whole point: "today" is a property of the workspace, not the viewer.
    expect(farStart).not.toBe(nearStart);
  });

  it('produces a half-open range that contains the current instant', () => {
    setTenantZone('Europe/Tirane');
    const { result } = renderHook(() => useDateFormat());

    const now = Date.now();
    const { start, end } = result.current.dayBounds();

    expect(now).toBeGreaterThanOrEqual(start.getTime());
    expect(now).toBeLessThan(end.getTime());
  });

  it('makes yesterday end exactly where today starts', () => {
    setTenantZone('America/New_York');
    const { result } = renderHook(() => useDateFormat());

    expect(result.current.dayBounds(-1).end.getTime()).toBe(
      result.current.dayBounds(0).start.getTime()
    );
  });

  it('falls back to UTC when the tenant has no timezone set', () => {
    const { result } = renderHook(() => useDateFormat());

    expect(result.current.dayBounds().start.toISOString()).toBe(
      dayBoundsInZone('UTC', 0).start.toISOString()
    );
  });
});
