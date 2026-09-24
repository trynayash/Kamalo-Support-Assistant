import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

const DEFAULT_API_PORT = process.env.EXPO_PUBLIC_API_PORT || '8081';
const FALLBACK_LAN_IP = '192.168.29.140';

function extractHost(candidate?: string | null): string | null {
  if (!candidate || typeof candidate !== 'string') return null;
  const match = candidate.match(/^(?:https?|exp):\/\/([^:/]+)/i);
  if (match && match[1]) {
    const host = match[1].trim();
    if (host && host !== 'localhost' && host !== '127.0.0.1' && host !== '::1') {
      return host;
    }
  }
  const rawParts = candidate.split(':');
  if (rawParts.length >= 1) {
    const host = rawParts[0].trim().replace(/^\/+/, '');
    if (host && host !== 'localhost' && host !== '127.0.0.1' && host !== '::1' && !host.includes('/')) {
      return host;
    }
  }
  return null;
}

/**
 * Resolves the API base URL across:
 * 1. Explicit EXPO_PUBLIC_API_URL or EXPO_PUBLIC_DOMAIN (production / tunnel / cloud)
 * 2. Web browser origin (via Vite proxy or same-origin)
 * 3. Metro bundle download source (NativeModules.SourceCode.scriptURL)
 * 4. Expo Go on physical device (auto-detects local network machine IP via Constants)
 * 5. Android Emulator (10.0.2.2 loopback)
 * 6. Local machine fallback (LAN IP for real devices, 127.0.0.1 for desktop/simulator)
 */
export function getApiBaseUrl(): string {
  // 1. Explicit API URL (e.g. http://192.168.29.140:8081 or https://api.my-domain.com)
  const explicitUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
  if (explicitUrl) {
    return explicitUrl.startsWith('http') ? explicitUrl : `https://${explicitUrl}`;
  }

  // 2. Explicit Domain (e.g. support.my-domain.com)
  const explicitDomain = process.env.EXPO_PUBLIC_DOMAIN?.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  if (explicitDomain) {
    return `https://${explicitDomain}`;
  }

  // 3. Web browser environment
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    const hostname = window.location.hostname || 'localhost';

    // If served via dev server proxy (like Vite on 5173)
    if (origin && !origin.includes(`:${DEFAULT_API_PORT}`)) {
      return origin;
    }
    return `http://${hostname}:${DEFAULT_API_PORT}`;
  }

  // 4. Extract host from the bundle download URL (NativeModules.SourceCode.scriptURL)
  // This is the actual IP the device used to load the JS bundle from Metro
  const scriptHost = extractHost((NativeModules as unknown as { SourceCode?: { scriptURL?: string } })?.SourceCode?.scriptURL);
  if (scriptHost) {
    return `http://${scriptHost}:${DEFAULT_API_PORT}`;
  }

  // 5. Native device via Expo Go config candidates
  const constantsAny = Constants as unknown as {
    expoConfig?: { hostUri?: string };
    expoGoConfig?: { debuggerHost?: string };
    manifest2?: {
      extra?: {
        expoGo?: { debuggerHost?: string };
        expoClient?: { hostUri?: string };
      };
    };
    manifest?: { debuggerHost?: string };
    experienceUrl?: string;
    linkingUri?: string;
  };

  const expoCandidateHosts = [
    constantsAny.expoConfig?.hostUri,
    constantsAny.expoGoConfig?.debuggerHost,
    constantsAny.manifest2?.extra?.expoGo?.debuggerHost,
    constantsAny.manifest2?.extra?.expoClient?.hostUri,
    constantsAny.manifest?.debuggerHost,
    constantsAny.experienceUrl,
    constantsAny.linkingUri,
  ];

  for (const candidate of expoCandidateHosts) {
    const host = extractHost(candidate);
    if (host) {
      return `http://${host}:${DEFAULT_API_PORT}`;
    }
  }

  // 6. LAN IP fallback for physical devices
  return `http://${FALLBACK_LAN_IP}:${DEFAULT_API_PORT}`;
}

export function getAttachmentUrl(conversationId: string, attachmentId: string): string {
  const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
  return `${baseUrl}/api/conversations/${conversationId}/attachments/${attachmentId}`;
}
