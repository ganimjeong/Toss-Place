import { join } from 'node:path';

import { POS_BRIDGE_CHANNELS } from '@toss-place/pos-bridge/channels';
import type { CardPaymentRequest, PosBridge, Receipt } from '@toss-place/pos-bridge';
import { app, BrowserWindow, ipcMain, Menu } from 'electron';

import { resolveBundleUrl, type BundleName } from './bundles';
import { createDeviceStub } from './devices';
import { createAppMenu } from './menu';

const isDev = process.env.BUNDLE_DEV === '1';

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

  Menu.setApplicationMenu(createAppMenu(name => void openBundle(name)));
  await openBundle('order');
});

app.on('window-all-closed', () => {
  app.quit();
});
