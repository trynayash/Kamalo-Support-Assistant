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
  static isTypeSupported = vi.fn(() => true);
  state: RecordingState = 'inactive';
  mimeType = 'audio/webm';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: FakeMediaRecorder.nextBlob });
    this.onstop?.();
  }
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
    FakeMediaRecorder.nextBlob = new Blob(['recorded audio'], { type: 'audio/webm' });
    installBrowserApis();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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

    expect(view.speech.isTranscribing).toBe(true);
    expect(view.speech.error).toBe('Transcribing locally…');
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

  it('reports empty recordings and transcription failures', async () => {
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