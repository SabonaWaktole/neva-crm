import { PlatformSettings, PlatformSettingsPatch } from './PlatformSettings';

export interface IPlatformSettingsRepository {
  /** Never null — a platform that has never saved this row is on `defaults()`. */
  get(): Promise<PlatformSettings>;
  save(patch: PlatformSettingsPatch): Promise<PlatformSettings>;
}
