import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSpeechInput } from '@/hooks/use-speech-input';
import { transcribeRecordedAudio } from '@/lib/local-speech-transcription';

vi.mock('@/lib/local-speech-transcription', () => ({
  transcribeRecordedAudio: vi.fn(),
}));

type SpeechInput = ReturnType<typeof useSpeechInput>;

type HarnessProps = {
  initialValue?: string;
  lang?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onReady: (speech: SpeechInput) => void;
};

function Harness({ initialValue = '', lang = 'en-IN', disabled, onChange, onReady }: HarnessProps) {
  const [value, setValue] = useState(initialValue);
  const speech = useSpeechInput({
    value,
    lang,
    disabled,
    onChange: (nextValue) => {
      setValue(nextValue);
      onChange(nextValue);
    },
  });
  onReady(speech);
  return null;
}

function renderSpeechInput(props: Omit<HarnessProps, 'onReady'>) {
  let speech: SpeechInput | undefined;
  const root: Root = createRoot(document.createElement('div'));
  act(() => {
    root.render(createElement(Harness, { ...props, onReady: (nextSpeech) => { speech = nextSpeech; } }));
  });
  return {
    get speech() {
      if (!speech) throw new Error('Speech hook did not render.');
      return speech;
    },
    leaveRoute: () => act(() => root.render(null)),
    unmount: () => act(() => root.unmount()),
  };
}

type FakeTrack = { stop: ReturnType<typeof vi.fn> };

function createStream() {
  const track: FakeTrack = { stop: vi.fn() };
  return {
    stream: { getTracks: () => [track] } as unknown as MediaStream,
    track,
  };
}

class FakeMediaRecorder {
  static nextBlob = new Blob(['recorded audio'], { type: 'audio/webm' });
  static instances: FakeMediaRecorder[] = [];
  static isTypeSupported = vi.fn(() => true);
  state: RecordingState = 'inactive';
  mimeType = 'audio/webm';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;

  constructor() {
    FakeMediaRecorder.instances.push(this);
  }

  start = vi.fn(() => {
    this.state = 'recording';
  });

  pause = vi.fn(() => {
    this.state = 'paused';
  });

  resume = vi.fn(() => {
    this.state = 'recording';
  });

  stop = vi.fn(() => {
    this.state = 'inactive';
    this.ondataavailable?.({ data: FakeMediaRecorder.nextBlob });
    this.onstop?.();
  });
}

class FakeSpeechRecognition {
  static instances: FakeSpeechRecognition[] = [];
  lang = '';
  continuous = false;
  interimResults = false;
  onend: (() => void) | null = null;
  onerror: ((event: { error?: string }) => void) | null = null;
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0?: { transcript?: string } }> }) => void) | null = null;

  constructor() {
    FakeSpeechRecognition.instances.push(this);
  }

  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
}

function installBrowserApis({
  speechRecognition = false,
  getUserMedia = vi.fn(async () => createStream().stream),
  audioContext = true,
}: {
  speechRecognition?: boolean;
  getUserMedia?: ReturnType<typeof vi.fn>;
  audioContext?: boolean;
} = {}) {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia },
  });
  Object.defineProperty(window, 'MediaRecorder', {
    configurable: true,
    value: FakeMediaRecorder,
  });
  Object.defineProperty(globalThis, 'MediaRecorder', {
    configurable: true,
    value: FakeMediaRecorder,
  });
  if (audioContext) {
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: class FakeAudioContext {},
    });
  } else {
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: undefined });
    Object.defineProperty(window, 'webkitAudioContext', { configurable: true, value: undefined });
  }
  if (speechRecognition) {
    Object.defineProperty(window, 'SpeechRecognition', {
      configurable: true,
      value: FakeSpeechRecognition,
    });
  } else {
    Object.defineProperty(window, 'SpeechRecognition', { configurable: true, value: undefined });
    Object.defineProperty(window, 'webkitSpeechRecognition', { configurable: true, value: undefined });
  }
}

async function flushReact() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useSpeechInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    FakeSpeechRecognition.instances = [];
    FakeMediaRecorder.instances = [];
    FakeMediaRecorder.nextBlob = new Blob(['recorded audio'], { type: 'audio/webm' });
    installBrowserApis();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('cleans up browser recognition, recording, microphone, and timers when leaving the chat route', async () => {
    vi.useFakeTimers();
    const { stream, track } = createStream();
    installBrowserApis({
      speechRecognition: true,
      getUserMedia: vi.fn(async () => stream),
    });
    const view = renderSpeechInput({ onChange: vi.fn() });

    await act(async () => {
      await view.speech.start();
    });

    const recognition = FakeSpeechRecognition.instances[0];
    const recorder = FakeMediaRecorder.instances[0];
    expect(recognition).toBeDefined();
    expect(recorder).toBeDefined();
    expect(recorder.state).toBe('recording');
    expect(vi.getTimerCount()).toBe(1);

    view.leaveRoute();

    expect(recognition.abort).toHaveBeenCalledOnce();
    expect(recorder.stop).toHaveBeenCalledOnce();
    expect(track.stop).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cleans up local fallback recording, microphone, and timers on unmount without transcribing', async () => {
    vi.useFakeTimers();
    const { stream, track } = createStream();
    installBrowserApis({
      getUserMedia: vi.fn(async () => stream),
    });
    const view = renderSpeechInput({ onChange: vi.fn() });

    await act(async () => {
      await view.speech.start();
    });

    const recorder = FakeMediaRecorder.instances[0];
    expect(recorder).toBeDefined();
    expect(recorder.state).toBe('recording');
    expect(vi.getTimerCount()).toBe(1);

    view.unmount();
    await flushReact();

    expect(recorder.stop).toHaveBeenCalledOnce();
    expect(track.stop).toHaveBeenCalledOnce();
    expect(transcribeRecordedAudio).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reports unsupported browsers without requesting a microphone', async () => {
    const getUserMedia = vi.fn();
    installBrowserApis({ getUserMedia, audioContext: false });
    const onChange = vi.fn();
    const view = renderSpeechInput({ onChange });

    await act(async () => {
      await view.speech.start();
    });

    expect(view.speech.isSupported).toBe(false);
    expect(view.speech.status).toBe('unsupported');
    expect(view.speech.error).toContain('not supported');
    expect(getUserMedia).not.toHaveBeenCalled();
    view.unmount();
  });

  it('surfaces denied microphone permission without starting recognition', async () => {
    const getUserMedia = vi.fn(async () => {
      throw new DOMException('Permission denied', 'NotAllowedError');
    });
    installBrowserApis({ speechRecognition: true, getUserMedia });
    const view = renderSpeechInput({ onChange: vi.fn() });

    await act(async () => {
      await view.speech.start();
    });

    expect(view.speech.status).toBe('error');
    expect(view.speech.error).toContain('Microphone access is blocked');
    expect(FakeSpeechRecognition.instances).toHaveLength(0);
    view.unmount();
  });

  it('recovers after microphone permission is restored and releases only the successful retry resources', async () => {
    let permissionGranted = false;
    const { stream, track } = createStream();
    const getUserMedia = vi.fn(async () => {
      if (!permissionGranted) {
        throw new DOMException('Permission denied', 'NotAllowedError');
      }
      return stream;
    });
    installBrowserApis({ speechRecognition: true, getUserMedia });
    const view = renderSpeechInput({ onChange: vi.fn() });

    await act(async () => {
      await view.speech.start();
    });

    expect(view.speech.status).toBe('error');
    expect(FakeSpeechRecognition.instances).toHaveLength(0);

    permissionGranted = true;
    await act(async () => {
      await view.speech.start();
    });

    expect(getUserMedia).toHaveBeenCalledTimes(2);
    expect(view.speech.status).toBe('listening');
    expect(FakeSpeechRecognition.instances).toHaveLength(1);
    expect(FakeMediaRecorder.instances).toHaveLength(1);

    view.unmount();

    expect(FakeSpeechRecognition.instances[0].abort).toHaveBeenCalledOnce();
    expect(FakeMediaRecorder.instances[0].stop).toHaveBeenCalledOnce();
    expect(track.stop).toHaveBeenCalledOnce();
  });

  it('refreshes support after browser voice APIs become available again', async () => {
    installBrowserApis({ audioContext: false });
    const view = renderSpeechInput({ onChange: vi.fn() });
    await flushReact();

    expect(view.speech.isSupported).toBe(false);

    installBrowserApis();
    await act(async () => {
      await view.speech.refreshSupport();
    });

    expect(view.speech.isSupported).toBe(true);
    expect(view.speech.status).toBe('idle');
    view.unmount();
  });

  it.each(['hi-IN', 'mr-IN'])('passes %s to local transcription during browser fallback', async (lang) => {
    const deferred = new Promise<string>((resolve) => {
      (globalThis as typeof globalThis & { resolveTranscript?: (value: string) => void }).resolveTranscript = resolve;
    });
    vi.mocked(transcribeRecordedAudio).mockReturnValue(deferred);
    installBrowserApis({ speechRecognition: true });
    const view = renderSpeechInput({ lang, onChange: vi.fn() });

    await act(async () => {
      await view.speech.start();
    });
    const recognition = FakeSpeechRecognition.instances[0];
    expect(recognition.lang).toBe(lang);

    act(() => {
      recognition.onerror?.({ error: 'network' });
    });
    await flushReact();

    expect(view.speech.isTranscribing).toBe(false);
    expect(view.speech.status).toBe('listening');
    expect(view.speech.error).toContain('Recording locally');
    expect(transcribeRecordedAudio).not.toHaveBeenCalled();

    act(() => view.speech.stop());
    await flushReact();
    expect(view.speech.isTranscribing).toBe(true);
    expect(transcribeRecordedAudio).toHaveBeenCalledWith(expect.any(Blob), lang);

    (globalThis as typeof globalThis & { resolveTranscript?: (value: string) => void }).resolveTranscript?.(
      lang === 'hi-IN' ? 'नमस्ते' : 'नमस्कार',
    );
    await flushReact();

    expect(view.speech.status).toBe('idle');
    expect(view.speech.isTranscribing).toBe(false);
    view.unmount();
  });

  it('shows local transcription progress and appends the transcript to the draft', async () => {
    const deferred = new Promise<string>((resolve) => {
      (globalThis as typeof globalThis & { resolveTranscript?: (value: string) => void }).resolveTranscript = resolve;
    });
    const onChange = vi.fn();
    vi.mocked(transcribeRecordedAudio).mockReturnValue(deferred);
    installBrowserApis();
    const view = renderSpeechInput({ initialValue: 'Existing question', lang: 'en-IN', onChange });

    await act(async () => {
      await view.speech.start();
    });
    act(() => view.speech.stop());
    await flushReact();

    expect(view.speech.isTranscribing).toBe(true);
    expect(view.speech.error).toBe('Transcribing locally…');
    expect(view.speech.status).toBe('listening');

    (globalThis as typeof globalThis & { resolveTranscript?: (value: string) => void }).resolveTranscript?.('recorded answer');
    await flushReact();

    expect(onChange).toHaveBeenCalledWith('Existing question recorded answer');
    expect(view.speech.status).toBe('idle');
    expect(view.speech.error).toBe('');
    view.unmount();
  });

  it('pauses and resumes a local recording before transcribing it on stop', async () => {
    const deferred = new Promise<string>((resolve) => {
      (globalThis as typeof globalThis & { resolveTranscript?: (value: string) => void }).resolveTranscript = resolve;
    });
    vi.mocked(transcribeRecordedAudio).mockReturnValue(deferred);
    installBrowserApis();
    const view = renderSpeechInput({ onChange: vi.fn() });

    await act(async () => {
      await view.speech.start();
    });
    const recorder = FakeMediaRecorder.instances[0];

    act(() => view.speech.pause());
    expect(view.speech.isPaused).toBe(true);
    expect(recorder.pause).toHaveBeenCalledOnce();
    expect(recorder.stop).not.toHaveBeenCalled();

    act(() => view.speech.resume());
    expect(view.speech.isPaused).toBe(false);
    expect(recorder.resume).toHaveBeenCalledOnce();

    act(() => view.speech.stop());
    await flushReact();
    expect(recorder.stop).toHaveBeenCalledOnce();
    expect(view.speech.isTranscribing).toBe(true);

    (globalThis as typeof globalThis & { resolveTranscript?: (value: string) => void }).resolveTranscript?.('paused voice question');
    await flushReact();
    expect(view.speech.status).toBe('idle');
    view.unmount();
  });

  it('preserves the pre-voice draft when local transcription fails', async () => {
    const onChange = vi.fn();
    installBrowserApis({ speechRecognition: true });
    const view = renderSpeechInput({ initialValue: 'Existing question', onChange });
    const transcriptionFailure = new Error('model unavailable');
    vi.mocked(transcribeRecordedAudio).mockRejectedValueOnce(transcriptionFailure);

    await act(async () => {
      await view.speech.start();
    });
    const recognition = FakeSpeechRecognition.instances[0];
    act(() => {
      recognition.onresult?.({
        resultIndex: 0,
        results: [{ isFinal: false, 0: { transcript: 'partial voice text' } }],
      });
      recognition.onerror?.({ error: 'network' });
    });
    await flushReact();

    expect(onChange).toHaveBeenLastCalledWith('Existing question partial voice text');
    expect(view.speech.status).toBe('listening');
    expect(view.speech.isTranscribing).toBe(false);
    act(() => view.speech.stop());
    await flushReact();
    expect(view.speech.status).toBe('error');
    expect(view.speech.error).toContain('Local voice transcription could not finish');
    expect(view.speech.hasRetryableRecording).toBe(true);
    view.unmount();
  });

  it('retries the failed recording through local transcription without recording again', async () => {
    const onChange = vi.fn();
    installBrowserApis();
    const view = renderSpeechInput({ initialValue: 'Existing question', onChange });
    vi.mocked(transcribeRecordedAudio)
      .mockRejectedValueOnce(new Error('model unavailable'))
      .mockResolvedValueOnce('recorded answer');

    await act(async () => {
      await view.speech.start();
    });
    act(() => view.speech.stop());
    await flushReact();

    expect(view.speech.hasRetryableRecording).toBe(true);
    expect(FakeMediaRecorder.instances).toHaveLength(1);

    act(() => view.speech.retryTranscription());
    await flushReact();

    expect(transcribeRecordedAudio).toHaveBeenCalledTimes(2);
    expect(transcribeRecordedAudio.mock.calls[1][0]).toBe(transcribeRecordedAudio.mock.calls[0][0]);
    expect(FakeMediaRecorder.instances).toHaveLength(1);
    expect(onChange).toHaveBeenLastCalledWith('Existing question recorded answer');
    expect(view.speech.hasRetryableRecording).toBe(false);
    expect(view.speech.status).toBe('idle');
    view.unmount();
  });

  it('dismisses a failed recording and does not retry it', async () => {
    installBrowserApis();
    const view = renderSpeechInput({ onChange: vi.fn() });
    vi.mocked(transcribeRecordedAudio).mockRejectedValueOnce(new Error('model unavailable'));

    await act(async () => {
      await view.speech.start();
    });
    act(() => view.speech.stop());
    await flushReact();

    expect(view.speech.hasRetryableRecording).toBe(true);
    act(() => view.speech.dismissRetryableRecording());

    expect(view.speech.hasRetryableRecording).toBe(false);
    act(() => view.speech.retryTranscription());
    await flushReact();
    expect(transcribeRecordedAudio).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('reports empty recordings and transcription failures without a draft', async () => {
    installBrowserApis();
    const view = renderSpeechInput({ onChange: vi.fn() });
    FakeMediaRecorder.nextBlob = new Blob([]);

    await act(async () => {
      await view.speech.start();
    });
    act(() => view.speech.stop());
    await flushReact();

    expect(view.speech.status).toBe('error');
    expect(view.speech.error).toContain("Didn't catch that");

    vi.mocked(transcribeRecordedAudio).mockRejectedValueOnce(new Error('model unavailable'));
    FakeMediaRecorder.nextBlob = new Blob(['recorded audio'], { type: 'audio/webm' });
    await act(async () => {
      await view.speech.start();
    });
    act(() => view.speech.stop());
    await flushReact();

    expect(view.speech.status).toBe('error');
    expect(view.speech.error).toContain('Local voice transcription could not finish');
    view.unmount();
  });
});