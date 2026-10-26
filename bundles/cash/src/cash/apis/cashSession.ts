import { delay } from 'es-toolkit';

export interface CashSession {
  /** 영업 시작 때 금전함에 넣어둔 돈 */
  openingCash: number;
  /** 오늘 현금으로 결제된 금액 */
  cashSales: number;
  /** 현금 환불, 지출로 금전함에서 나간 돈 */
  cashOut: number;
}

const FAKE_NETWORK_DELAY_MS = 300;

// 서버 붙기 전까지 쓰는 고정 데이터임
export async function fetchCashSession(): Promise<CashSession> {
  await delay(FAKE_NETWORK_DELAY_MS);
  return { openingCash: 100000, cashSales: 235500, cashOut: 12000 };
}

export function getExpectedCash({ openingCash, cashSales, cashOut }: CashSession) {
  return openingCash + cashSales - cashOut;
}
