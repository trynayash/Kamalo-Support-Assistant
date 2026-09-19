import { expect, test, type Page } from '@playwright/test';

type VoiceTestState = {
  nativeSpeechRecognitionAvailable: boolean;
  streams: MediaStream[];
  recognition: {
    started: boolean;
    stopped: boolean;
    aborted: boolean;
  } | null;
};

declare global {
  interface Window {
    __voiceTestState?: VoiceTestState;
  }
}

async function installVoiceObserver(page: Page, disableSpeechRecognition: boolean) {
  await page.addInitScript(({ disableSpeechRecognition }) => {
    const nativeSpeechRecognition = (window as Window & {
      SpeechRecognition?: new () => {
        start: () => void;
        stop: () => void;
        abort: () => void;
      };
      webkitSpeechRecognition?: new () => {
        start: () => void;
        stop: () => void;
        abort: () => void;
      };
    }).SpeechRecognition || (window as Window & {
      webkitSpeechRecognition?: new () => {
        start: () => void;
        stop: () => void;
        abort: () => void;
      };
    }).webkitSpeechRecognition;

    const state: VoiceTestState = {
      nativeSpeechRecognitionAvailable: Boolean(nativeSpeechRecognition),
      streams: [],
      recognition: null,
    };
    window.__voiceTestState = state;

    const mediaDevices = navigator.mediaDevices;
    const originalGetUserMedia = mediaDevices?.getUserMedia?.bind(mediaDevices);
    if (originalGetUserMedia) {
      mediaDevices.getUserMedia = async (...args) => {
        const stream = await originalGetUserMedia(...args);
        state.streams.push(stream);
        return stream;
      };
    }

    if (nativeSpeechRecognition && !disableSpeechRecognition) {
      const SpeechRecognition = nativeSpeechRecognition;
      const ObservedSpeechRecognition = function (this: unknown) {
        const recognition = new SpeechRecognition();
        state.recognition = { started: false, stopped: false, aborted: false };
        const start = recognition.start.bind(recognition);
        const stop = recognition.stop.bind(recognition);
        const abort = recognition.abort.bind(recognition);
        recognition.start = () => {
          if (state.recognition) state.recognition.started = true;
          start();
        };
        recognition.stop = () => {
          if (state.recognition) state.recognition.stopped = true;
          stop();
        };
        recognition.abort = () => {
          if (state.recognition) state.recognition.aborted = true;
          abort();
        };
        return recognition;
      } as unknown as typeof SpeechRecognition;
      ObservedSpeechRecognition.prototype = SpeechRecognition.prototype;
      Object.defineProperty(window, 'SpeechRecognition', {
        configurable: true,
        value: ObservedSpeechRecognition,
      });
      Object.defineProperty(window, 'webkitSpeechRecognition', {
        configurable: true,
        value: ObservedSpeechRecognition,
      });
    } else if (disableSpeechRecognition) {
      Object.defineProperty(window, 'SpeechRecognition', {
        configurable: true,
        value: undefined,
      });
      Object.defineProperty(window, 'webkitSpeechRecognition', {
        configurable: true,
        value: undefined,
      });
    }
  }, { disableSpeechRecognition });
}

async function stubConversationList(page: Page) {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/conversations') {
      await route.fulfill({
        contentType: 'application/json',
        body: '[]',
      });
      return;
    }
    await route.continue();
  });
}

async function startVoiceAndNavigateAway(page: Page) {
  await stubConversationList(page);
  await page.goto('/');
  const voiceButton = page.getByTestId('button-voice-input');
  await expect(voiceButton).toBeVisible();
  await expect(voiceButton).toBeEnabled();
  await voiceButton.click();
  await expect.poll(() => page.evaluate(() => window.__voiceTestState?.streams
    .flatMap((stream) => stream.getTracks())
    .filter((track) => track.readyState === 'live').length || 0)).toBeGreaterThan(0);

  await page.getByTestId('link-topbar-history').click();
  await expect(page).toHaveURL(/\/history$/);
  await expect.poll(() => page.evaluate(() => window.__voiceTestState?.streams
    .flatMap((stream) => stream.getTracks())
    .filter((track) => track.readyState === 'live').length || 0)).toBe(0);
}

test('stops the real browser recognition microphone when navigating away from chat', async ({ page }) => {
  await installVoiceObserver(page, false);
  await stubConversationList(page);
  await page.goto('/');
  const hasNativeRecognition = await page.evaluate(() => window.__voiceTestState?.nativeSpeechRecognitionAvailable);
  test.skip(!hasNativeRecognition, 'Chromium does not expose SpeechRecognition in this environment.');

  const voiceButton = page.getByTestId('button-voice-input');
  await expect(voiceButton).toBeVisible();
  await expect(voiceButton).toBeEnabled();
  await voiceButton.click();
  await expect.poll(() => page.evaluate(() => window.__voiceTestState?.recognition?.started)).toBe(true);
  const liveTrackCount = await page.evaluate(() => window.__voiceTestState?.streams
    .flatMap((stream) => stream.getTracks())
    .filter((track) => track.readyState === 'live').length || 0);
  test.skip(
    liveTrackCount === 0,
    'Chromium speech recognition ended before navigation; the local recording fallback covers this hosted environment.',
  );

  await page.getByTestId('link-topbar-history').click();
  await expect(page).toHaveURL(/\/history$/);
  await expect.poll(() => page.evaluate(() => window.__voiceTestState?.streams
    .flatMap((stream) => stream.getTracks())
    .filter((track) => track.readyState === 'live').length || 0)).toBe(0);
  await expect.poll(() => page.evaluate(() => {
    const recognition = window.__voiceTestState?.recognition;
    return Boolean(recognition?.aborted || recognition?.stopped);
  })).toBe(true);
});

test('stops the real local recording microphone when navigating away from chat', async ({ page }) => {
  await installVoiceObserver(page, true);
  await startVoiceAndNavigateAway(page);
});