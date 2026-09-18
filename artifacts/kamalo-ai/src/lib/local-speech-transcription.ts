import { env, pipeline } from '@huggingface/transformers';

type Transcriber = (
  audio: Float32Array,
  options: {
    chunk_length_s: number;
    stride_length_s: number;
    language?: string;
    task: 'transcribe';
  },
) => Promise<{ text?: string } | Array<{ text?: string }>>;

let transcriberPromise: Promise<Transcriber> | null = null;

function getTranscriber(): Promise<Transcriber> {
  if (!transcriberPromise) {
    env.allowLocalModels = false;
    env.useBrowserCache = true;
    transcriberPromise = pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
      device: 'wasm',
    }) as unknown as Promise<Transcriber>;
  }
  return transcriberPromise;
}

function toMono(audioBuffer: AudioBuffer): Float32Array {
  if (audioBuffer.numberOfChannels === 1) return audioBuffer.getChannelData(0);
  const mono = new Float32Array(audioBuffer.length);
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
    const samples = audioBuffer.getChannelData(channel);
    for (let index = 0; index < samples.length; index += 1) {
      mono[index] += samples[index] / audioBuffer.numberOfChannels;
    }
  }
  return mono;
}

export async function transcribeRecordedAudio(blob: Blob, language?: string): Promise<string> {
  if (!blob.size) return '';
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) throw new Error('Local speech transcription is not supported in this browser.');

  const context = new AudioContextConstructor();
  try {
    const bytes = await blob.arrayBuffer();
    const audioBuffer = await context.decodeAudioData(bytes);
    const transcriber = await getTranscriber();
    const languageCode = language?.split('-')[0].toLowerCase();
    const result = await transcriber(toMono(audioBuffer), {
      chunk_length_s: 30,
      stride_length_s: 5,
      language: languageCode === 'en' ? 'en' : undefined,
      task: 'transcribe',
    });
    const first = Array.isArray(result) ? result[0] : result;
    return first?.text?.trim() || '';
  } finally {
    await context.close();
  }
}