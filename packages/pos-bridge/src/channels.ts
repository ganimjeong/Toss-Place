/** Electron 셸의 preload와 main이 같은 이름을 쓰도록 채널을 한곳에서 정의함 */
export const POS_BRIDGE_CHANNELS = {
  printReceipt: 'pos-bridge:print-receipt',
  openCashDrawer: 'pos-bridge:open-cash-drawer',
  requestCardPayment: 'pos-bridge:request-card-payment',
} as const;
