import { POS_BRIDGE_CHANNELS } from '@toss-place/pos-bridge/channels';
import type { PosBridge } from '@toss-place/pos-bridge';
import { contextBridge, ipcRenderer } from 'electron';

// 렌더러에 ipcRenderer를 직접 노출하지 않고 표준 인터페이스에 맞춘 함수만 내보냄
const posBridge: PosBridge = {
  printReceipt: receipt => ipcRenderer.invoke(POS_BRIDGE_CHANNELS.printReceipt, receipt),
  openCashDrawer: () => ipcRenderer.invoke(POS_BRIDGE_CHANNELS.openCashDrawer),
  requestCardPayment: request =>
    ipcRenderer.invoke(POS_BRIDGE_CHANNELS.requestCardPayment, request),
};

contextBridge.exposeInMainWorld('posBridge', posBridge);
