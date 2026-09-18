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

  const start = useCallback(() => {
    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (disabled || !SpeechRecognition) {
      setStatus('unsupported');
      setError('Voice input is not supported in this browser.');
      return;
    }
    recognitionRef.current?.abort();
    const recognition = new SpeechRecognition();
    baseTextRef.current = value.trim();
    recognition.lang = lang || (typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US');
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let transcript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index]?.[0]?.transcript || '';
      }
      onChange(joinTranscript(baseTextRef.current, transcript));
    };
    recognition.onerror = (event) => {
      if (event.error === 'aborted') return;
      setStatus('error');
      setError(event.error === 'not-allowed'
        ? 'Microphone access is blocked. Allow microphone access and try again.'
        : 'Voice input could not hear that. Please try again.');
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setStatus('idle');
    };
    recognitionRef.current = recognition;
    setError('');
    setStatus('listening');
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setStatus('error');
      setError('Voice input could not start. Please try again.');
    }
  }, [disabled, lang, onChange, value]);

  const toggle = useCallback(() => {
    if (status === 'listening') stop();
    else start();
  }, [start, status, stop]);

  return { error, isListening: status === 'listening', isSupported, start, stop, toggle };
}