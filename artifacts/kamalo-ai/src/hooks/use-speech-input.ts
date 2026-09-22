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

export type SpeechInputStatus = 'idle' | 'listening' | 'paused' | 'unsupported' | 'error';

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

function isMicrophoneAccessError(message: string): boolean {
  return message.startsWith('Microphone access is blocked')
    || message.startsWith('No microphone');
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

const LOCAL_TRANSCRIPTION_TIMEOUT_MS = 90_000;

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
  const retriedNetworkErrorRef = useRef(false);
  const recordingTimerRef = useRef<number | null>(null);
  const retryableRecordingRef = useRef<{ blob: Blob; baseText: string } | null>(null);
  const pauseRequestedRef = useRef(false);
  const isMountedRef = useRef(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [status, setStatus] = useState<SpeechInputStatus>('idle');
  const [error, setError] = useState('');
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [hasRetryableRecording, setHasRetryableRecording] = useState(false);

  const clearRetryableRecording = useCallback((updateState = true) => {
    retryableRecordingRef.current = null;
    if (updateState) setHasRetryableRecording(false);
  }, []);

  const cleanupVoiceResources = useCallback(() => {
    if (recordingTimerRef.current !== null) {
      window.clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      try {
        recognition.abort();
      } catch {
        // The browser can throw if recognition already ended during teardown.
      }
    }

    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      if (recorder.state === 'recording' || recorder.state === 'paused') {
        try {
          recorder.stop();
        } catch {
          // The browser can throw if recording ended during teardown.
        }
      }
    }

    microphoneStreamRef.current?.getTracks().forEach((track) => track.stop());
    microphoneStreamRef.current = null;
    recordedChunksRef.current = [];
    localFallbackRef.current = false;
    pauseRequestedRef.current = false;
    recorderHandledRef.current = true;
  }, []);

  const refreshSupport = useCallback(async () => {
    const supported = getVoiceSupport();
    if (!isMountedRef.current) return;
    setIsSupported(supported);
    if (!supported) {
      setStatus((current) => (current === 'listening' ? current : 'unsupported'));
      return;
    }

    setStatus((current) => (current === 'unsupported' ? 'idle' : current));

    if (typeof navigator === 'undefined' || !navigator.permissions?.query) return;
    try {
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (!isMountedRef.current) return;
      if (permission.state === 'granted' || permission.state === 'prompt') {
        setError((current) => (isMicrophoneAccessError(current) ? '' : current));
      }
    } catch {
      // Permissions API is optional and can reject for unsupported browsers.
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void refreshSupport();
    const handleFocus = () => {
      void refreshSupport();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refreshSupport();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cleanupVoiceResources();
      clearRetryableRecording(false);
    };
  }, [cleanupVoiceResources, clearRetryableRecording, refreshSupport]);

  const stop = useCallback(() => {
    pauseRequestedRef.current = false;
    if (recordingTimerRef.current !== null) {
      window.clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore a recognition instance that ended between the stop request and this call.
    }
    const recorder = recorderRef.current;
    if (recorder?.state === 'recording' || recorder?.state === 'paused') recorder.stop();
    if (!localFallbackRef.current && status === 'paused') setStatus('idle');
  }, [status]);

  const pause = useCallback(() => {
    if (!isMountedRef.current || status !== 'listening') return;
    pauseRequestedRef.current = true;
    const recorder = recorderRef.current;
    if (recorder?.state === 'recording') recorder.pause();
    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore a recognition instance that ended while pausing.
    }
    setStatus('paused');
  }, [status]);

  const startLocalTranscription = useCallback(async (blob: Blob, baseText: string) => {
    if (!isMountedRef.current) return;
    if (!blob.size) {
      clearRetryableRecording();
      if (baseText) onChange(baseText);
      setStatus('error');
      setError(messageForRecognitionError('no-speech'));
      return;
    }
    retryableRecordingRef.current = { blob, baseText };
    setHasRetryableRecording(true);
    setIsTranscribing(true);
    setStatus('listening');
    setError('Transcribing locally…');
    let timeoutId: number | null = null;
    try {
      const { transcribeRecordedAudio } = await import('@/lib/local-speech-transcription');
      const timeout = new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error('Local voice transcription timed out.')), LOCAL_TRANSCRIPTION_TIMEOUT_MS);
      });
      const transcript = await Promise.race([transcribeRecordedAudio(blob, lang), timeout]);
      if (!isMountedRef.current) return;
      if (!transcript) {
        if (baseText) onChange(baseText);
        setStatus('error');
        setError(messageForRecognitionError('no-speech'));
        return;
      }
      onChange(joinTranscript(baseText, transcript));
      clearRetryableRecording();
      setError('');
      setStatus('idle');
    } catch {
      if (!isMountedRef.current) return;
      if (baseText) onChange(baseText);
      setStatus('error');
      setError('Local voice transcription could not finish. Your draft is still editable. Retry voice or type your question.');
    } finally {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (isMountedRef.current) setIsTranscribing(false);
    }
  }, [clearRetryableRecording, lang, onChange]);

  const retryTranscription = useCallback(() => {
    const recording = retryableRecordingRef.current;
    if (!recording || isTranscribing || !isMountedRef.current) return;
    void startLocalTranscription(recording.blob, recording.baseText);
  }, [isTranscribing, startLocalTranscription]);

  const dismissRetryableRecording = useCallback(() => {
    clearRetryableRecording();
  }, [clearRetryableRecording]);

  const stopRecording = useCallback((shouldTranscribe: boolean) => {
    localFallbackRef.current = shouldTranscribe;
    const recorder = recorderRef.current;
    if (!recorder) {
      microphoneStreamRef.current?.getTracks().forEach((track) => track.stop());
      microphoneStreamRef.current = null;
      return;
    }
    if (recorder.state === 'recording' || recorder.state === 'paused') {
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
    if (!isMountedRef.current) return;
    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) return;
    recognitionRef.current?.abort();
    const recognition = new SpeechRecognition();
    baseTextRef.current = value.trim();
    recognition.lang = lang || (typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US');
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      retriedNetworkErrorRef.current = false;
      clearRetryableRecording();
      let transcript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index]?.[0]?.transcript || '';
      }
      onChange(joinTranscript(baseTextRef.current, transcript));
    };
    recognition.onerror = (event) => {
      if (event.error === 'aborted') return;
      // Browser speech recognition can fail with "network" even when the user's
      // connection and microphone are healthy. Keep the local recorder running
      // and wait for an explicit stop before transcribing the complete recording.
      if (canRecordLocally() && event.error !== 'not-allowed' && event.error !== 'permission-denied' && event.error !== 'audio-capture') {
        localFallbackRef.current = true;
        pauseRequestedRef.current = false;
        const failedRecognition = recognitionRef.current;
        recognitionRef.current = null;
        if (failedRecognition) {
          failedRecognition.onend = null;
          failedRecognition.onerror = null;
          failedRecognition.onresult = null;
          try {
            failedRecognition.abort();
          } catch {
            // The recognition service may already be ending after its error.
          }
        }
        setStatus('listening');
        setError('Recording locally. Speak naturally, then tap Stop when you are finished.');
        return;
      }
      if (event.error === 'not-allowed' || event.error === 'permission-denied' || event.error === 'audio-capture') {
        cleanupVoiceResources();
      }
      setStatus('error');
      setError(messageForRecognitionError(event.error));
    };
    recognition.onend = () => {
      if (recordingTimerRef.current !== null) {
        window.clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      recognitionRef.current = null;
      if (pauseRequestedRef.current) {
        setStatus('paused');
        return;
      }
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
      cleanupVoiceResources();
      setStatus('error');
      setError('Voice input could not start. Please try again.');
    }
  }, [cleanupVoiceResources, clearRetryableRecording, lang, onChange, stopRecording, value]);

  const resume = useCallback(() => {
    if (!isMountedRef.current || status !== 'paused') return;
    pauseRequestedRef.current = false;
    const recorder = recorderRef.current;
    if (recorder?.state === 'paused') recorder.resume();
    if (!localFallbackRef.current && getSpeechRecognitionConstructor()) {
      beginRecognition();
    } else {
      setStatus('listening');
    }
  }, [beginRecognition, status]);

  const start = useCallback(async () => {
    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!isMountedRef.current) return;
    if (disabled || !getVoiceSupport()) {
      setStatus('unsupported');
      setError('Voice input is not supported in this browser. Try Chrome, Edge, or the KAMALO mobile app.');
      return;
    }
    if (recognitionRef.current || recorderRef.current || microphoneStreamRef.current) {
      cleanupVoiceResources();
    }
    setError('');
    retriedNetworkErrorRef.current = false;
    pauseRequestedRef.current = false;
    const access = await ensureMicrophoneAccess();
    if (!isMountedRef.current) return;
    if (!access.ok) {
      setStatus('error');
      setError(messageForRecognitionError(access.error));
      return;
    }
    if (!isMountedRef.current) {
      access.stream?.getTracks().forEach((track) => track.stop());
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
          if (recordingTimerRef.current !== null) {
            window.clearTimeout(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }
          const chunks = recordedChunksRef.current;
          recordedChunksRef.current = [];
          recorderRef.current = null;
          access.stream?.getTracks().forEach((track) => track.stop());
          microphoneStreamRef.current = null;
          recorderHandledRef.current = true;
          if (localFallbackRef.current && isMountedRef.current) {
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

    if (!isMountedRef.current) {
      cleanupVoiceResources();
      return;
    }
    setStatus('listening');
    recordingTimerRef.current = window.setTimeout(() => {
      setError('Voice note reached the 60-second limit. Transcribing it now…');
      stop();
    }, 60_000);
    if (SpeechRecognition) beginRecognition();
  }, [beginRecognition, cleanupVoiceResources, disabled, startLocalTranscription, stop, value]);

  const toggle = useCallback(() => {
    if (status === 'listening') stop();
    else if (status === 'paused') resume();
    else start();
  }, [resume, start, status, stop]);

  return {
    error,
    hasRetryableRecording,
    isListening: status === 'listening' || status === 'paused' || isTranscribing,
    isPaused: status === 'paused',
    isTranscribing,
    isSupported,
    pause,
    refreshSupport,
    retryTranscription,
    dismissRetryableRecording,
    resume,
    status,
    start,
    stop,
    toggle,
  };
}