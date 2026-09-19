import { beforeEach, describe, expect, it, vi } from 'vitest';

const pipeline = vi.fn();

vi.mock('@huggingface/transformers', () => ({
  env: {
    allowLocalModels: true,
    useBrowserCache: false,
  },
  pipeline,
}));

describe('transcribeRecordedAudio', () => {
  beforeEach(() => {
    pipeline.mockReset();
    Object.defineProperty(navigator, 'gpu', { configurable: true, value: {} });
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: class FakeAudioContext {
        async decodeAudioData() {
          return {
            numberOfChannels: 1,
            length: 3,
            getChannelData: () => new Float32Array([0.1, 0.2, 0.3]),
          };
        }

        async close() {}
      },
    });
  });

  it('skips empty recordings without loading Whisper', async () => {
    const { transcribeRecordedAudio } = await import('@/lib/local-speech-transcription');

    await expect(transcribeRecordedAudio(new Blob([]), 'hi-IN')).resolves.toBe('');
    expect(pipeline).not.toHaveBeenCalled();
  });

  it('falls back from WebGPU to WASM and preserves Hindi and Marathi language codes', async () => {
    const transcriber = vi.fn(async (_audio: Float32Array, options: { language?: string }) => ({
      text: options.language === 'hi' ? 'नमस्ते' : 'नमस्कार',
    }));
    pipeline.mockImplementation(async (_task: string, _model: string, options: { device: string }) => {
      if (options.device === 'webgpu') throw new Error('WebGPU unavailable');
      return transcriber;
    });
    const { transcribeRecordedAudio } = await import('@/lib/local-speech-transcription');
    const blob = new Blob(['audio bytes'], { type: 'audio/webm' });

    await expect(transcribeRecordedAudio(blob, 'hi-IN')).resolves.toBe('नमस्ते');
    await expect(transcribeRecordedAudio(blob, 'mr-IN')).resolves.toBe('नमस्कार');

    expect(pipeline.mock.calls.map((call) => call[2].device)).toEqual(['webgpu', 'wasm']);
    expect(transcriber.mock.calls.map((call) => call[1].language)).toEqual(['hi', 'mr']);
  });
});