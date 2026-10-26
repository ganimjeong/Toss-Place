import type { BrowserWindow } from 'electron';

import { BUNDLE_NAMES, type BundleName } from './bundles';

/** 번들이 이 시간 안에 화면을 그리지 못하면 실패로 봄 */
const RENDER_TIMEOUT_MS = 10_000;

/**
 * 패키징한 앱이 실제로 번들을 그리는지 확인함. CI에서 OS별 빌드 직후에 돌림.
 * 빌드가 성공해도 경로, CSP, asar 같은 런타임 문제로 빈 화면이 뜰 수 있어서임.
 */
export async function runSmokeTest(
  window: BrowserWindow,
  openBundle: (name: BundleName) => Promise<void>,
) {
  const failures: string[] = [];

  for (const name of BUNDLE_NAMES) {
    try {
      await openBundle(name);
      await waitForRender(window);
    } catch (error) {
      failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (failures.length > 0) {
    console.error(`[smoke-test] 실패\n${failures.join('\n')}`);
    return 1;
  }
  console.warn(`[smoke-test] 통과: ${BUNDLE_NAMES.join(', ')}`);
  return 0;
}

async function waitForRender(window: BrowserWindow) {
  const deadline = Date.now() + RENDER_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const rendered: unknown = await window.webContents.executeJavaScript(
      "document.getElementById('root')?.childElementCount > 0",
    );
    if (rendered === true) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error(`${RENDER_TIMEOUT_MS}ms 안에 화면을 그리지 못함`);
}
