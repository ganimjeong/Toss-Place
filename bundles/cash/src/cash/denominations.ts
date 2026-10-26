import { sumWon } from '@toss-place/utils';

/** 금전함에 들어가는 권종. 큰 금액부터 셈 */
export const DENOMINATIONS = [50000, 10000, 5000, 1000, 500, 100, 50, 10] as const;

export type Denomination = (typeof DENOMINATIONS)[number];

export type CashCount = Record<Denomination, number>;

export function createEmptyCashCount(): CashCount {
  return { 50000: 0, 10000: 0, 5000: 0, 1000: 0, 500: 0, 100: 0, 50: 0, 10: 0 };
}

export function sumCashCount(count: CashCount): number {
  return sumWon(DENOMINATIONS.map(denomination => denomination * count[denomination]));
}

export function isBill(denomination: Denomination) {
  return denomination >= 1000;
}
