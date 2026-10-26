import { join } from 'node:path';

import { POS_BRIDGE_CHANNELS } from '@toss-place/pos-bridge/channels';
import type { CardPaymentRequest, PosBridge, Receipt } from '@toss-place/pos-bridge';
import { app, BrowserWindow, ipcMain } from 'electron';

import { createDeviceStub } from './devices';

function resolveOrderBundleUrl() {
  // 개발 중에는 Vite 개발 서버, 배포 시에는 빌드된 번들 파일을 엶
  return (
    process.env.ORDER_BUNDLE_URL ??
    `file://${join(__dirname, '../../../bundles/order/dist/index.html')}`
  );
}

function registerPosBridge(devices: PosBridge) {
  ipcMain.handle(POS_BRIDGE_CHANNELS.printReceipt, (_event, receipt: Receipt) =>
    devices.printReceipt(receipt),
  );
  ipcMain.handle(POS_BRIDGE_CHANNELS.openCashDrawer, () => devices.openCashDrawer());
  ipcMain.handle(POS_BRIDGE_CHANNELS.requestCardPayment, (_event, request: CardPaymentRequest) =>
    devices.requestCardPayment(request),
  );
}

async function createMainWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });
  await window.loadURL(resolveOrderBundleUrl());
}

void app.whenReady().then(async () => {
  registerPosBridge(createDeviceStub());
  await createMainWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});
