import { join } from 'node:path';

import { POS_BRIDGE_CHANNELS } from '@toss-place/pos-bridge/channels';
import type { CardPaymentRequest, PosBridge, Receipt } from '@toss-place/pos-bridge';
import { app, BrowserWindow, ipcMain, Menu } from 'electron';

import { resolveBundleUrl, type BundleName } from './bundles';
import { startCrashReporting } from './crashReporting';
import { createDeviceStub } from './devices';
import { createAppMenu } from './menu';
import { runSmokeTest } from './smokeTest';

const isDev = process.env.BUNDLE_DEV === '1';
const isSmokeTest = process.argv.includes('--smoke-test');
// 성능 측정(scripts/measure.ts) 중에는 창을 보이지 않게 둠.
// show: false면 Chromium이 화면을 그리지 않아 측정이 틀어지므로, 투명하게 띄우고 포커스를 뺏지 않음
const isMeasuring = process.argv.includes('--measure');

// macOS는 앱이 뜨는 순간 활성화되어 다른 앱의 포커스를 가져감. 측정 중에는 Dock에 없는 보조 앱으로 띄움
if (isMeasuring && process.platform === 'darwin') {
  app.setActivationPolicy('accessory');
}
// 측정 창은 다른 창에 덮여 있어도 계속 그려야 함. 가려진 창을 백그라운드로 보고 렌더링과 타이머를 멈추는 동작을 끔
if (isMeasuring) {
  app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
  app.commandLine.appendSwitch('disable-renderer-backgrounding');
  app.commandLine.appendSwitch('disable-background-timer-throttling');
}

// SENTRY_DSN은 빌드할 때 tsdown이 값으로 바꿔 넣음
startCrashReporting(process.env.SENTRY_DSN ?? '');

function registerPosBridge(devices: PosBridge) {
  ipcMain.handle(POS_BRIDGE_CHANNELS.printReceipt, (_event, receipt: Receipt) =>
    devices.printReceipt(receipt),
  );
  ipcMain.handle(POS_BRIDGE_CHANNELS.openCashDrawer, () => devices.openCashDrawer());
  ipcMain.handle(POS_BRIDGE_CHANNELS.requestCardPayment, (_event, request: CardPaymentRequest) =>
    devices.requestCardPayment(request),
  );
  ipcMain.handle(POS_BRIDGE_CHANNELS.getCardPayment, (_event, idempotencyKey: string) =>
    devices.getCardPayment(idempotencyKey),
  );
}

function createMainWindow() {
  return new BrowserWindow({
    width: 1280,
    height: 800,
    show: !isSmokeTest && !isMeasuring,
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      // 가려진 창은 requestAnimationFrame이 멈춰서 overlay-kit 다이얼로그가 열리지 않음. 보이지 않게 띄우는 측정 중에만 끔
      backgroundThrottling: !isMeasuring,
    },
  });
}

void app.whenReady().then(async () => {
  registerPosBridge(createDeviceStub());

  const window = createMainWindow();
  if (isMeasuring) {
    window.setOpacity(0);
    window.setIgnoreMouseEvents(true);
    window.showInactive();
  }
  const openBundle = (name: BundleName) => window.loadURL(resolveBundleUrl(name, { isDev }));

  if (isSmokeTest) {
    app.exit(await runSmokeTest(window, openBundle));
    return;
  }

  // 번들을 못 찾으면 빈 창만 남고 원인이 묻히므로 사유를 남김
  const openBundleOrReport = (name: BundleName) =>
    openBundle(name).catch((error: unknown) => {
      console.error(`[shell] ${name} 번들을 열지 못함`, error);
    });

  Menu.setApplicationMenu(createAppMenu(name => void openBundleOrReport(name)));
  await openBundleOrReport('order');
});

app.on('window-all-closed', () => {
  app.quit();
});
