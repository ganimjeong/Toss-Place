import { join } from 'node:path';

import { POS_BRIDGE_CHANNELS } from '@toss-place/pos-bridge/channels';
import type { CardPaymentRequest, PosBridge, Receipt } from '@toss-place/pos-bridge';
import { app, BrowserWindow, ipcMain, Menu } from 'electron';

import { resolveBundleUrl, type BundleName } from './bundles';
import { createDeviceStub } from './devices';
import { createAppMenu } from './menu';
import { runSmokeTest } from './smokeTest';

const isDev = process.env.BUNDLE_DEV === '1';
const isSmokeTest = process.argv.includes('--smoke-test');

function registerPosBridge(devices: PosBridge) {
  ipcMain.handle(POS_BRIDGE_CHANNELS.printReceipt, (_event, receipt: Receipt) =>
    devices.printReceipt(receipt),
  );
  ipcMain.handle(POS_BRIDGE_CHANNELS.openCashDrawer, () => devices.openCashDrawer());
  ipcMain.handle(POS_BRIDGE_CHANNELS.requestCardPayment, (_event, request: CardPaymentRequest) =>
    devices.requestCardPayment(request),
  );
}

function createMainWindow() {
  return new BrowserWindow({
    width: 1280,
    height: 800,
    show: !isSmokeTest,
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });
}

void app.whenReady().then(async () => {
  registerPosBridge(createDeviceStub());

  const window = createMainWindow();
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
