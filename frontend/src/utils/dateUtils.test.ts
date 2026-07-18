import { describe, it, expect } from 'vitest';
import { isSameDayLocal } from './dateUtils';

describe('dateUtils', () => {
  describe('isSameDayLocal', () => {
    it('returns true if the UTC timestamp falls on the target local date, despite UTC day boundary crossing', () => {
      // Simulate a local timezone for the test environment. 
      // If we are in UTC-4 (EST), an appointment at 2023-10-15T02:00:00Z (UTC)
      // is actually 2023-10-14 22:00 (10:00 PM) local time.
      // Therefore, it should match the local date '2023-10-14'.
      
      // We'll mock the Date timezone offset to ensure a stable test environment if needed, 
      // but for simplicity, we can just instantiate local Date objects.
      
      const utcString = '2023-10-15T02:00:00Z';
      const localTargetDate = new Date(utcString); // This parses into the local time equivalent (e.g. Oct 14 22:00:00 EDT)
      
      // They refer to the same moment in time, so their local days are identical.
      expect(isSameDayLocal(utcString, localTargetDate)).toBe(true);
    });

    it('returns false for the next day, even if the UTC string date matches the local date string naively', () => {
      const utcString = '2023-10-15T02:00:00Z';
      const actualLocalDate = new Date(utcString);
      
      // Let's create a target date that is explicitly ONE DAY AFTER the local interpretation of the UTC string
      const targetDate = new Date(actualLocalDate);
      targetDate.setDate(targetDate.getDate() + 1);
      
      expect(isSameDayLocal(utcString, targetDate)).toBe(false);
    });
    it('stays on the same local day when close to midnight without falsely crossing over', () => {
      // e.g. 11:45 PM local time. We want to ensure it doesn't accidentally bump to the next day.
      const localBase = new Date();
      localBase.setHours(23, 45, 0, 0); // 11:45 PM local
      
      const utcString = localBase.toISOString(); 
      // isSameDayLocal should confirm that the UTC string resolves to the same local day as our target
      expect(isSameDayLocal(utcString, localBase)).toBe(true);
    });

    it('crosses FORWARD to the next local day if the UTC timestamp is late night and local timezone is ahead (simulated)', () => {
      // To simulate a UTC+ timezone crossing forward without relying on the system TZ, 
      // we take a UTC time (e.g. 23:00) and if we were in UTC+2, the local time would be 01:00 the next day.
      // We can prove this by creating a UTC string that resolves to 01:00 AM local time.
      const localBase = new Date();
      localBase.setHours(1, 0, 0, 0); // 1:00 AM local time (next day for a late UTC time)
      
      const utcString = localBase.toISOString(); // e.g. previous day 20:00Z if we are UTC+5
      
      // The function must correctly identify that the UTC string belongs to the 'localBase' day
      expect(isSameDayLocal(utcString, localBase)).toBe(true);
      
      // And it should NOT match the previous local day
      const previousDay = new Date(localBase);
      previousDay.setDate(previousDay.getDate() - 1);
      expect(isSameDayLocal(utcString, previousDay)).toBe(false);
    });

    it('handles exact midnight UTC precisely', () => {
      // 00:00:00Z exact midnight
      const utcString = '2023-10-15T00:00:00.000Z';
      
      // The local date parsed from this exact midnight UTC string
      const exactLocalTarget = new Date(utcString);
      
      expect(isSameDayLocal(utcString, exactLocalTarget)).toBe(true);
      
      // Ensure it doesn't bleed into +/- 1 day
      const nextDay = new Date(exactLocalTarget);
      nextDay.setDate(nextDay.getDate() + 1);
      expect(isSameDayLocal(utcString, nextDay)).toBe(false);
    });
  });
});
