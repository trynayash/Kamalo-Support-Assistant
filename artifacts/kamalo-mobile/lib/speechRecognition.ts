import { useEffect } from 'react';
import { requireOptionalNativeModule } from 'expo';
import type {
  ExpoSpeechRecognitionErrorEvent,
  ExpoSpeechRecognitionOptions,
  ExpoSpeechRecognitionResultEvent,
} from 'expo-speech-recognition';

type SpeechRecognitionEvents = {
  start: () => void;
  end: () => void;
  result: (event: ExpoSpeechRecognitionResultEvent) => void;
  error: (event: ExpoSpeechRecognitionErrorEvent) => void;
};

export type SpeechRecognitionModule = {
  addListener<EventName extends keyof SpeechRecognitionEvents>(
    eventName: EventName,
    listener: SpeechRecognitionEvents[EventName],
  ): { remove: () => void };
  requestPermissionsAsync: () => Promise<{ granted: boolean; canAskAgain?: boolean }>;
  start: (options: ExpoSpeechRecognitionOptions) => void;
  stop: () => void;
};

let cachedModule: SpeechRecognitionModule | null | undefined;

/**
 * Expo Go does not include custom native modules like ExpoSpeechRecognition.
 * We check requireOptionalNativeModule first so Expo Go does not throw or log
 * an unhandled native module error, while development builds can still use voice.
 */
export function getSpeechRecognitionModule(): SpeechRecognitionModule | null {
  if (cachedModule !== undefined) return cachedModule;

  try {
    const nativeModule =
      typeof requireOptionalNativeModule === 'function'
        ? requireOptionalNativeModule('ExpoSpeechRecognition')
        : null;

    if (!nativeModule) {
      cachedModule = null;
      return null;
    }

    const speechPackage = require('expo-speech-recognition') as {
      ExpoSpeechRecognitionModule?: SpeechRecognitionModule;
    };
    cachedModule = speechPackage.ExpoSpeechRecognitionModule ?? null;
  } catch {
    cachedModule = null;
  }

  return cachedModule;
}

export function useOptionalSpeechRecognitionEvent<EventName extends keyof SpeechRecognitionEvents>(
  eventName: EventName,
  listener: SpeechRecognitionEvents[EventName],
) {
  useEffect(() => {
    const module = getSpeechRecognitionModule();
    if (!module) return undefined;

    const subscription = module.addListener(eventName, listener);
    return () => subscription.remove();
  }, [eventName, listener]);
}