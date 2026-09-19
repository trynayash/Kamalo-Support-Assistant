import { useEffect } from 'react';
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
 * Expo Go does not always include optional third-party native modules.
 * Keep the module out of the initial import path so text chat can still start.
 */
export function getSpeechRecognitionModule(): SpeechRecognitionModule | null {
  if (cachedModule !== undefined) return cachedModule;

  try {
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