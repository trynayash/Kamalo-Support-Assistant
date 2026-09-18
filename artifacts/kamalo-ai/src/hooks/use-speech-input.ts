import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechRecognitionResultEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0?: { transcript?: string };
  }>;
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export type SpeechInputStatus = 'idle' | 'listening' | 'unsupported' | 'error';

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function isEmbeddedInCrossOriginFrame(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function messageForRecognitionError(error: string | undefined): string {
  switch (error) {
    case 'not-allowed':
    case 'permission-denied':
      return isEmbeddedInCrossOriginFrame()
        ? 'Microphone access is blocked in this embedded preview. Open the app in its own browser tab, then try Voice again.'
        : 'Microphone access is blocked. Allow microphone access in your browser settings and try again.';
    case 'audio-capture':
      return isEmbeddedInCrossOriginFrame()
        ? 'No microphone is reachable from this embedded preview. Open the app in its own browser tab, then try Voice again.'
        : 'No microphone was found. Check that a microphone is connected and try again.';
    case 'network':
      return 'Voice recognition needs an internet connection. Check your connection and try again.';
    case 'service-not-allowed':
      return 'Voice input is disabled by your browser or device settings.';
    case 'language-not-supported':
      return 'Voice input does not support this language yet.';
    case 'no-speech':
      return "Didn't catch that. Try speaking again, closer to the microphone.";
    default:
      return 'Voice input could not hear that. Please try again.';
  }
}

async function ensureMicrophoneAccess(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    // Some browsers expose SpeechRecognition without exposing getUserMedia (e.g. older Safari).
    // Let SpeechRecognition itself request the permission in that case.
    return { ok: true };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return { ok: true };
  } catch (error) {
    const name = error instanceof Error ? error.name : '';
    if (name === 'NotAllowedError' || name === 'SecurityError') return { ok: false, error: 'not-allowed' };
    if (name === 'NotFoundError' || name === 'OverconstrainedError') return { ok: false, error: 'audio-capture' };
    return { ok: false, error: 'audio-capture' };
  }
}

function joinTranscript(base: string, transcript: string): string {
  const normalizedBase = base.trim();
  const normalizedTranscript = transcript.trim();
  if (!normalizedBase) return normalizedTranscript;
  if (!normalizedTranscript) return normalizedBase;
  return `${normalizedBase} ${normalizedTranscript}`.trim().slice(0, 4000);
}

export function useSpeechInput({
  value,
  onChange,
  disabled = false,
  lang,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  lang?: string;
}) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const baseTextRef = useRef('');
  const retriedNetworkErrorRef = useRef(false);
  const [status, setStatus] = useState<SpeechInputStatus>('idle');
  const [error, setError] = useState('');
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setIsSupported(Boolean(getSpeechRecognitionConstructor()));
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const beginRecognition = useCallback(() => {
    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (disabled || !SpeechRecognition) {
      setStatus('unsupported');
      setError('Voice input is not supported in this browser. Try Chrome, Edge, or the KAMALO mobile app.');
      return;
    }
    recognitionRef.current?.abort();
    const recognition = new SpeechRecognition();
    baseTextRef.current = value.trim();
    recognition.lang = lang || (typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US');
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      retriedNetworkErrorRef.current = false;
      let transcript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index]?.[0]?.transcript || '';
      }
      onChange(joinTranscript(baseTextRef.current, transcript));
    };
    recognition.onerror = (event) => {
      if (event.error === 'aborted') return;
      // Transient network hiccups against the browser's recognition backend are common on the first attempt; retry once silently.
      if (event.error === 'network' && !retriedNetworkErrorRef.current) {
        retriedNetworkErrorRef.current = true;
        recognitionRef.current = null;
        window.setTimeout(() => beginRecognition(), 300);
        return;
      }
      setStatus('error');
      setError(messageForRecognitionError(event.error));
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setStatus((current) => (current === 'error' ? current : 'idle'));
    };
    recognitionRef.current = recognition;
    setStatus('listening');
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setStatus('error');
      setError('Voice input could not start. Please try again.');
    }
  }, [disabled, lang, onChange, value]);

  const start = useCallback(async () => {
    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (disabled || !SpeechRecognition) {
      setStatus('unsupported');
      setError('Voice input is not supported in this browser. Try Chrome, Edge, or the KAMALO mobile app.');
      return;
    }
    setError('');
    retriedNetworkErrorRef.current = false;
    const access = await ensureMicrophoneAccess();
    if (!access.ok) {
      setStatus('error');
      setError(messageForRecognitionError(access.error));
      return;
    }
    beginRecognition();
  }, [beginRecognition, disabled]);

  const toggle = useCallback(() => {
    if (status === 'listening') stop();
    else start();
  }, [start, status, stop]);

  return { error, isListening: status === 'listening', isSupported, start, stop, toggle };
}