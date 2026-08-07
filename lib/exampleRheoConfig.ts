import type { RheoConfig } from '@getrheo/react-native-expo';
import { RHEO_DEFAULT_SDK_API_BASE_URL } from '@getrheo/contracts/sdk';
import { Platform } from 'react-native';

export const EXAMPLE_CONFIG_STORAGE_KEY = 'rheo.exampleConfig.v1';

/**
 * Android emulator loopback is the guest, not the Mac.
 * Map host-local URLs to the emulator alias for the host machine.
 */
export const resolveApiBaseUrlForPlatform = (url: string): string => {
  if (Platform.OS !== 'android') return url;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      parsed.hostname = '10.0.2.2';
      // URL#toString keeps a trailing slash for bare origins; trim to match input style.
      return parsed.toString().replace(/\/$/, '');
    }
  } catch {
    /* ignore invalid URLs — leave as entered */
  }
  return url;
};

export const DEFAULT_API_URL = resolveApiBaseUrlForPlatform(
  process.env.EXPO_PUBLIC_API_BASE_URL ?? RHEO_DEFAULT_SDK_API_BASE_URL,
);

export type SavedConfig = {
  publishableKey: string;
  channelId: string;
  apiBaseUrl: string;
  userId: string;
  /** When true, `<Flow fallback={…} />` shows hardcoded offline UI on resolve failure. */
  useResolveFallback?: boolean;
  /** When true, hide the Expo Router stack header on the onboarding route. */
  hideFlowNavigationBar?: boolean;
};

export const canStartExampleConfig = (config: SavedConfig): boolean =>
  config.publishableKey.trim().length > 0 &&
  config.channelId.trim().length > 0 &&
  config.apiBaseUrl.trim().length > 0;

/** Rheo config for the example app — must stay aligned with the onboarding route. */
export const buildExampleRheoConfig = (config: SavedConfig): RheoConfig => ({
  publishableKey: config.publishableKey.trim(),
  apiBaseUrl: resolveApiBaseUrlForPlatform(config.apiBaseUrl.trim()),
  userId: config.userId.trim() || 'example-user',
  appVersion: '0.1.0',
  sessionId: `sess_${Date.now()}`,
  locale: 'en',
});
