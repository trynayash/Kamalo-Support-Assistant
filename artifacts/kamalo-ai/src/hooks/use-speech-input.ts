import { useCallback, useEffect, useRef, useState } from 'react';

export type SpeechInputStatus = 'idle' | 'listening' | 'paused' | 'unsupported' | 'error';

function canRecordLocally(): boolean {
  return typeof window !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof window.MediaRecorder !== 'undefined';
}

function isEmbeddedInCrossOriginFrame(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function messageForRecordingError(error: string | undefined): string {
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
    default:
      return 'Voice input could not start. Please try again.';
  }
}

function messageForTranscriptionError(message: string): string {
  if (/didn't catch that/i.test(message)) {
    return "Didn't catch that. Try speaking again, closer to the microphone.";
  }
  return message;
}

function joinTranscript(base: string, transcript: string): string {
  const normalizedBase = base.trim();
  const normalizedTranscript = transcript.trim();
  if (!normalizedBase) return normalizedTranscript;
  if (!normalizedTranscript) return normalizedBase;
  return `${normalizedBase} ${normalizedTranscript}`.trim().slice(0, 4000);
}

async function ensureMicrophoneAccess(): Promise<{ ok: true; stream: MediaStream } | { ok: false; error: string }> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return { ok: false, error: 'audio-capture' };
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

const TRANSCRIPTION_TIMEOUT_MS = 90_000;

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
  const recorderRef = useRef<MediaRecorder | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recorderHandledRef = useRef(false);
  const baseTextRef = useRef('');
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

    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      if (recorder.state === 'recording' || recorder.state === 'paused') {
        try {
          recorder.stop();
        } catch {
          // Ignore recorder teardown races.
        }
      }
    }

    microphoneStreamRef.current?.getTracks().forEach((track) => track.stop());
    microphoneStreamRef.current = null;
    recordedChunksRef.current = [];
    pauseRequestedRef.current = false;
    recorderHandledRef.current = true;
  }, []);

  const refreshSupport = useCallback(async () => {
    const supported = canRecordLocally();
    if (!isMountedRef.current) return;
    setIsSupported(supported);
    if (!supported) {
      setStatus((current) => (current === 'listening' ? current : 'unsupported'));
      return;
    }
    setStatus((current) => (current === 'unsupported' ? 'idle' : current));
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void refreshSupport();
    return () => {
      isMountedRef.current = false;
      cleanupVoiceResources();
      clearRetryableRecording(false);
    };
  }, [cleanupVoiceResources, clearRetryableRecording, refreshSupport]);

  const transcribeRecording = useCallback(async (blob: Blob, baseText: string) => {
    if (!isMountedRef.current) return;
    if (!blob.size) {
      clearRetryableRecording();
      if (baseText) onChange(baseText);
      setStatus('error');
      setError("Didn't catch that. Try speaking again, closer to the microphone.");
      return;
    }

    retryableRecordingRef.current = { blob, baseText };
    setHasRetryableRecording(true);
    setIsTranscribing(true);
    setStatus('listening');
    setError('Transcribing your voice…');

    let timeoutId: number | null = null;
    try {
      const { transcribeRecordedAudio } = await import('@/lib/remote-speech-transcription');
      const timeout = new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error('Voice transcription timed out.')), TRANSCRIPTION_TIMEOUT_MS);
      });
      const transcript = await Promise.race([transcribeRecordedAudio(blob, lang), timeout]);
      if (!isMountedRef.current) return;
      if (!transcript) {
        if (baseText) onChange(baseText);
        setStatus('error');
        setError("Didn't catch that. Try speaking again, closer to the microphone.");
        return;
      }
      onChange(joinTranscript(baseText, transcript));
      clearRetryableRecording();
      setError('');
      setStatus('idle');
    } catch (caught) {
      if (!isMountedRef.current) return;
      if (baseText) onChange(baseText);
      setStatus('error');
      setError(messageForTranscriptionError(
        caught instanceof Error ? caught.message : 'Voice transcription could not finish. Your draft is still editable. Retry voice or type your question.',
      ));
    } finally {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (isMountedRef.current) setIsTranscribing(false);
    }
  }, [clearRetryableRecording, lang, onChange]);

  const retryTranscription = useCallback(() => {
    const recording = retryableRecordingRef.current;
    if (!recording || isTranscribing || !isMountedRef.current) return;
    void transcribeRecording(recording.blob, recording.baseText);
  }, [isTranscribing, transcribeRecording]);

  const dismissRetryableRecording = useCallback(() => {
    clearRetryableRecording();
  }, [clearRetryableRecording]);

  const stopRecording = useCallback((shouldTranscribe: boolean) => {
    const recorder = recorderRef.current;
    if (!recorder) {
      microphoneStreamRef.current?.getTracks().forEach((track) => track.stop());
      microphoneStreamRef.current = null;
      return;
    }
    if (recorder.state === 'recording' || recorder.state === 'paused') {
      recorder.onstop = () => {
        if (recordingTimerRef.current !== null) {
          window.clearTimeout(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        const chunks = recordedChunksRef.current;
        recordedChunksRef.current = [];
        recorderRef.current = null;
        microphoneStreamRef.current?.getTracks().forEach((track) => track.stop());
        microphoneStreamRef.current = null;
        recorderHandledRef.current = true;
        if (shouldTranscribe && isMountedRef.current) {
          void transcribeRecording(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }), baseTextRef.current);
        } else if (isMountedRef.current) {
          setStatus((current) => (current === 'error' ? current : 'idle'));
        }
      };
      recorder.stop();
    }
  }, [transcribeRecording]);

  const stop = useCallback(() => {
    pauseRequestedRef.current = false;
    stopRecording(true);
  }, [stopRecording]);

  const pause = useCallback(() => {
    if (!isMountedRef.current || status !== 'listening') return;
    pauseRequestedRef.current = true;
    const recorder = recorderRef.current;
    if (recorder?.state === 'recording') recorder.pause();
    setStatus('paused');
  }, [status]);

  const resume = useCallback(() => {
    if (!isMountedRef.current || status !== 'paused') return;
    pauseRequestedRef.current = false;
    const recorder = recorderRef.current;
    if (recorder?.state === 'paused') recorder.resume();
    setStatus('listening');
  }, [status]);

  const start = useCallback(async () => {
    if (!isMountedRef.current) return;
    if (disabled || !canRecordLocally()) {
      setStatus('unsupported');
      setError('Voice input is not supported in this browser. Try Chrome, Edge, or the KAMALO mobile app.');
      return;
    }
    if (recorderRef.current || microphoneStreamRef.current) {
      cleanupVoiceResources();
    }

    setError('');
    pauseRequestedRef.current = false;
    const access = await ensureMicrophoneAccess();
    if (!isMountedRef.current) return;
    if (!access.ok) {
      setStatus('error');
      setError(messageForRecordingError(access.error));
      return;
    }

    baseTextRef.current = value.trim();
    recorderHandledRef.current = false;
    recordedChunksRef.current = [];
    microphoneStreamRef.current = access.stream;

    const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
      .find((candidate) => MediaRecorder.isTypeSupported(candidate));

    try {
      const recorder = new MediaRecorder(access.stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };
      recorderRef.current = recorder;
      recorder.start(250);
    } catch {
      access.stream.getTracks().forEach((track) => track.stop());
      microphoneStreamRef.current = null;
      recorderRef.current = null;
      setStatus('error');
      setError('Voice input could not start. Please try again.');
      return;
    }

    setStatus('listening');
    recordingTimerRef.current = window.setTimeout(() => {
      setError('Voice note reached the 60-second limit. Transcribing it now…');
      stop();
    }, 60_000);
  }, [cleanupVoiceResources, disabled, stop, value]);

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
