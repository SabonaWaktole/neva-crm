import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('useDebounce Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce the value update by the specified delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Update value
    rerender({ value: 'updated', delay: 500 });

    // Value should not update immediately
    expect(result.current).toBe('initial');

    // Fast-forward time by 250ms (half the delay)
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toBe('initial');

    // Fast-forward time to complete the delay
    act(() => {
      vi.advanceTimersByTime(250);
    });

    // Value should now be updated
    expect(result.current).toBe('updated');
  });

  it('should cancel the previous timer if value changes before delay completes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // Update value to "first update"
    rerender({ value: 'first update', delay: 500 });
    
    act(() => {
      vi.advanceTimersByTime(300); // Wait 300ms
    });
    
    // Value still initial
    expect(result.current).toBe('initial');

    // Update value to "second update" before 500ms is reached
    rerender({ value: 'second update', delay: 500 });

    act(() => {
      vi.advanceTimersByTime(300); // Total 600ms since first update, but timer was reset
    });

    // Value still initial because the timer reset and only 300ms has passed since the second update
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(200); // Complete the remaining 200ms of the second update's timer
    });

    // Value should now be the second update
    expect(result.current).toBe('second update');
  });
});
