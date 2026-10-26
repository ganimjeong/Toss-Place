import { createMockPosBridge } from './mock';
import type { PosBridge } from './types';

declare global {
  interface Window {
    /** Electron 셸의 preload가 주입함. 브라우저에서는 없음 */
    posBridge?: PosBridge;
  }
}

let fallback: PosBridge | undefined;

export function getPosBridge(): PosBridge {
  if (typeof window !== 'undefined' && window.posBridge !== undefined) {
    return window.posBridge;
  }
  fallback ??= createMockPosBridge();
  return fallback;
}
