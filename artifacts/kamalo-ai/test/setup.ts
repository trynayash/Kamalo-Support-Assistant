import { afterEach } from 'vitest';

declare global {
  // React 19 uses this flag to enable act() warnings in non-browser runners.
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  document.body.replaceChildren();
});