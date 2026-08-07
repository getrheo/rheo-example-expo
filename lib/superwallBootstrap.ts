import { Platform } from 'react-native';

let didConfigure = false;
let didAttachDebugDelegate = false;

type SuperwallCompatModule = {
  default?: SuperwallCompat;
  LogLevel?: { Debug: string; Info: string; Warn: string; Error: string; None: string };
  LogScope?: { All: string };
  SuperwallDelegate?: new () => SuperwallDebugDelegate;
};

type SuperwallCompat = {
  configure: (args: {
    apiKey: string;
    options?: {
      logging?: { level?: string; scopes?: string[] };
    };
  }) => Promise<unknown>;
  shared: {
    identify: (args: { userId: string }) => Promise<void>;
    setDelegate: (delegate: SuperwallDebugDelegate | undefined) => Promise<void>;
    setLogLevel?: (level: string) => Promise<void>;
  };
};

type SuperwallDebugDelegate = {
  handleLog: (
    level: string,
    scope: string,
    message?: string,
    info?: Record<string, unknown> | null,
    error?: string | null,
  ) => void;
  handleSuperwallEvent: (eventInfo: { event?: unknown; params?: Record<string, unknown> }) => void;
  willPresentPaywall: (paywallInfo: unknown) => void;
  didPresentPaywall: (paywallInfo: unknown) => void;
  willDismissPaywall: (paywallInfo: unknown) => void;
  didDismissPaywall: (paywallInfo: unknown) => void;
  handleCustomPaywallAction: (name: string) => void;
  subscriptionStatusDidChange: (from: unknown, to: unknown) => void;
};

const PREFIX = '[rheo-example][superwall]';

const getApiKey = (): string => {
  if (Platform.OS === 'ios') {
    return (
      process.env.EXPO_PUBLIC_SUPERWALL_IOS_API_KEY?.trim() ||
      process.env.EXPO_PUBLIC_SUPERWALL_API_KEY?.trim() ||
      ''
    );
  }
  if (Platform.OS === 'android') {
    return (
      process.env.EXPO_PUBLIC_SUPERWALL_ANDROID_API_KEY?.trim() ||
      process.env.EXPO_PUBLIC_SUPERWALL_API_KEY?.trim() ||
      ''
    );
  }
  return '';
};

const maskApiKey = (apiKey: string): string => {
  if (apiKey.length <= 8) return '***';
  return `${apiKey.slice(0, 6)}…${apiKey.slice(-4)}`;
};

/** True when a Superwall public API key is present for the current native platform. */
export const hasSuperwallApiKey = (): boolean => getApiKey().length > 0;

const createDebugDelegate = (DelegateBase: new () => SuperwallDebugDelegate): SuperwallDebugDelegate => {
  const delegate = new DelegateBase();

  delegate.handleLog = (level, scope, message, info, error) => {
    const payload = {
      scope,
      message: message ?? '',
      ...(info ? { info } : {}),
      ...(error ? { error } : {}),
    };
    const line = `${PREFIX} native[${level}]`;
    if (level === 'error') {
      console.warn(line, payload);
      return;
    }
    console.log(line, payload);
  };

  delegate.handleSuperwallEvent = (eventInfo) => {
    console.log(`${PREFIX} event`, eventInfo?.event ?? eventInfo, eventInfo?.params ?? {});
  };

  delegate.willPresentPaywall = (paywallInfo) => {
    console.log(`${PREFIX} willPresentPaywall`, paywallInfo);
  };
  delegate.didPresentPaywall = (paywallInfo) => {
    console.log(`${PREFIX} didPresentPaywall`, paywallInfo);
  };
  delegate.willDismissPaywall = (paywallInfo) => {
    console.log(`${PREFIX} willDismissPaywall`, paywallInfo);
  };
  delegate.didDismissPaywall = (paywallInfo) => {
    console.log(`${PREFIX} didDismissPaywall`, paywallInfo);
  };
  delegate.handleCustomPaywallAction = (name) => {
    console.log(`${PREFIX} customPaywallAction`, name);
  };
  delegate.subscriptionStatusDidChange = (from, to) => {
    console.log(`${PREFIX} subscriptionStatusDidChange`, { from, to });
  };

  return delegate;
};

/**
 * Configure Superwall (via `expo-superwall/compat`) and identify the Rheo
 * `identity.appUserId` before `<Flow />` can hit a Superwall Integration Node.
 * Safe no-op when env keys are unset or on web.
 *
 * In `__DEV__`, enables Superwall debug logging (all scopes) and attaches a
 * delegate that mirrors native logs / paywall lifecycle to the Metro console.
 *
 * Uses the compat imperative API so `@getrheo/react-native-core`'s
 * `presentSuperwallPaywall` can call `Superwall.shared.register`. Prefer a
 * custom dev client (`expo run:ios` / `android`); Expo Go cannot load the
 * native module.
 */
export const prepareSuperwallForFlow = async (userId: string): Promise<void> => {
  if (Platform.OS === 'web') return;
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn(
      `${PREFIX} set EXPO_PUBLIC_SUPERWALL_IOS_API_KEY / EXPO_PUBLIC_SUPERWALL_ANDROID_API_KEY (or EXPO_PUBLIC_SUPERWALL_API_KEY) in .env to exercise Superwall paywalls — dev build only, not Expo Go.`,
    );
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('expo-superwall/compat') as SuperwallCompatModule & SuperwallCompat;
    const Superwall = (mod.default ?? mod) as SuperwallCompat;
    const debugLogging = typeof __DEV__ !== 'undefined' && __DEV__;

    if (!didConfigure) {
      console.log(`${PREFIX} configuring`, {
        platform: Platform.OS,
        apiKey: maskApiKey(apiKey),
        debugLogging,
      });

      await Superwall.configure({
        apiKey,
        ...(debugLogging && mod.LogLevel && mod.LogScope
          ? {
              options: {
                logging: {
                  level: mod.LogLevel.Debug,
                  scopes: [mod.LogScope.All],
                },
              },
            }
          : {}),
      });
      didConfigure = true;
      console.log(`${PREFIX} configure complete`);
    }

    if (debugLogging && !didAttachDebugDelegate && mod.SuperwallDelegate) {
      const delegate = createDebugDelegate(mod.SuperwallDelegate);
      await Superwall.shared.setDelegate(delegate);
      if (typeof Superwall.shared.setLogLevel === 'function' && mod.LogLevel) {
        await Superwall.shared.setLogLevel(mod.LogLevel.Debug);
      }
      didAttachDebugDelegate = true;
      console.log(`${PREFIX} debug delegate attached (native logs → Metro)`);
    }

    const uid = userId.trim() || 'example-user';
    console.log(`${PREFIX} identify`, { userId: uid });
    await Superwall.shared.identify({ userId: uid });
    console.log(`${PREFIX} identify complete`);
  } catch (err) {
    console.warn(`${PREFIX} bootstrap failed:`, err);
  }
};
