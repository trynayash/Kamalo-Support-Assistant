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
    webkitAudioContext?: typeof AudioContext;
  }
}

export type SpeechInputStatus = 'idle' | 'listening' | 'unsupported' | 'error';

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function canRecordLocally(): boolean {
  return typeof window !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof window.MediaRecorder !== 'undefined' &&
    Boolean(window.AudioContext || window.webkitAudioContext);
}

function getVoiceSupport(): boolean {
  return Boolean(getSpeechRecognitionConstructor()) || canRecordLocally();
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

async function ensureMicrophoneAccess(): Promise<{ ok: true; stream: MediaStream | null } | { ok: false; error: string }> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    // Some browsers expose SpeechRecognition without exposing getUserMedia (e.g. older Safari).
    // Let SpeechRecognition itself request the permission in that case.
    return { ok: true, stream: null };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return { ok: true, stream };
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
  const recorderRef = useRef<MediaRecorder | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const localFallbackRef = useRef(false);
  const recorderHandledRef = useRef(false);
  const baseTextRef = useRef('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [status, setStatus] = useState<SpeechInputStatus>('idle');
  const [error, setError] = useState('');
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setIsSupported(getVoiceSupport());
    return () => {
      recognitionRef.current?.abort();
      recorderRef.current?.stop();
      microphoneStreamRef.current?.getTracks().forEach((track) => track.stop());
      recognitionRef.current = null;
      recorderRef.current = null;
      microphoneStreamRef.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    const recorder = recorderRef.current;
    if (!recognitionRef.current && recorder?.state === 'recording') recorder.stop();
  }, []);

  const startLocalTranscription = useCallback(async (blob: Blob, baseText: string) => {
    if (!blob.size) {
      setStatus('error');
      setError(messageForRecognitionError('no-speech'));
      return;
    }
    setIsTranscribing(true);
    setStatus('listening');
    setError('Transcribing locally…');
    try {
      const { transcribeRecordedAudio } = await import('@/lib/local-speech-transcription');
      const transcript = await transcribeRecordedAudio(blob, lang);
      if (!transcript) {
        setStatus('error');
        setError(messageForRecognitionError('no-speech'));
        return;
      }
      onChange(joinTranscript(baseText, transcript));
      setError('');
      setStatus('idle');
    } catch (caught) {
      console.error('Local voice transcription failed', caught);
      setStatus('error');
      setError('Local voice transcription could not finish. Please try Voice again or type your question.');
    } finally {
      setIsTranscribing(false);
    }
  }, [lang, onChange]);

  const stopRecording = useCallback((shouldTranscribe: boolean) => {
    localFallbackRef.current = shouldTranscribe;
    const recorder = recorderRef.current;
    if (!recorder) {
      microphoneStreamRef.current?.getTracks().forEach((track) => track.stop());
      microphoneStreamRef.current = null;
      return;
    }
    if (recorder.state === 'recording') {
      recorder.stop();
      return;
    }
    if (!recorderHandledRef.current) {
      recorderHandledRef.current = true;
      microphoneStreamRef.current?.getTracks().forEach((track) => track.stop());
      microphoneStreamRef.current = null;
    }
  }, []);

  const beginRecognition = useCallback(() => {
    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) return;
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
      // Browser speech recognition can fail with "network" even when the user's
      // connection and microphone are healthy. Use the recorded audio instead of
      // asking the user to retry against the same unavailable browser service.
      if (canRecordLocally() && event.error !== 'not-allowed' && event.error !== 'permission-denied' && event.error !== 'audio-capture') {
        setError('Browser voice recognition is unavailable. Transcribing locally…');
        stopRecording(true);
        return;
      }
      setStatus('error');
      setError(messageForRecognitionError(event.error));
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      if (!localFallbackRef.current) {
        stopRecording(false);
        setStatus((current) => (current === 'error' ? current : 'idle'));
      }
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
  }, [lang, onChange, stopRecording, value]);

  const start = useCallback(async () => {
    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (disabled || !getVoiceSupport()) {
      setStatus('unsupported');
      setError('Voice input is not supported in this browser. Try Chrome, Edge, or the KAMALO mobile app.');
      return;
    }
    setError('');
    const access = await ensureMicrophoneAccess();
    if (!access.ok) {
      setStatus('error');
      setError(messageForRecognitionError(access.error));
      return;
    }
    baseTextRef.current = value.trim();
    localFallbackRef.current = !SpeechRecognition;
    recorderHandledRef.current = false;
    recordedChunksRef.current = [];
    microphoneStreamRef.current = access.stream;

    if (access.stream && typeof window.MediaRecorder !== 'undefined') {
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
        .find((candidate) => MediaRecorder.isTypeSupported(candidate));
      try {
        const recorder = new MediaRecorder(access.stream, mimeType ? { mimeType } : undefined);
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) recordedChunksRef.current.push(event.data);
        };
        recorder.onstop = () => {
          const chunks = recordedChunksRef.current;
          recordedChunksRef.current = [];
          recorderRef.current = null;
          access.stream?.getTracks().forEach((track) => track.stop());
          microphoneStreamRef.current = null;
          recorderHandledRef.current = true;
          if (localFallbackRef.current) {
            void startLocalTranscription(new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' }), baseTextRef.current);
          }
        };
        recorderRef.current = recorder;
        recorder.start(250);
      } catch {
        access.stream.getTracks().forEach((track) => track.stop());
        microphoneStreamRef.current = null;
        recorderRef.current = null;
      }
    }

    setStatus('listening');
    if (SpeechRecognition) beginRecognition();
  }, [beginRecognition, disabled, startLocalTranscription, value]);

  const toggle = useCallback(() => {
    if (status === 'listening') stop();
    else start();
  }, [start, status, stop]);

  return { error, isListening: status === 'listening' || isTranscribing, isSupported, start, stop, toggle };
}