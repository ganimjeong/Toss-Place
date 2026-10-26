/**
 * 금액은 원 단위 정수로만 다룸.
 * 소수점이 생기는 계산은 이 파일 안에서만 하고, 밖으로는 항상 정수를 내보냄.
 */

export function assertWon(amount: number): void {
  if (!Number.isSafeInteger(amount)) {
    throw new RangeError(`금액은 원 단위 정수여야 합니다. (받은 값: ${amount})`);
  }
}

export function sumWon(amounts: readonly number[]): number {
  return amounts.reduce((total, amount) => {
    assertWon(amount);
    return total + amount;
  }, 0);
}

/**
 * 더치페이처럼 금액을 n명에게 나눔.
 * 나누어 떨어지지 않는 나머지는 앞사람부터 1원씩 더 냄.
 */
export function splitWon(amount: number, count: number): number[] {
  assertWon(amount);
  if (!Number.isSafeInteger(count) || count < 1) {
    throw new RangeError(`나눌 인원은 1 이상의 정수여야 합니다. (받은 값: ${count})`);
  }

  const base = Math.floor(amount / count);
  const remainder = amount - base * count;

  return Array.from({ length: count }, (_, index) => (index < remainder ? base + 1 : base));
}

const wonFormatter = new Intl.NumberFormat('ko-KR');

export function formatWon(amount: number): string {
  assertWon(amount);
  return `${wonFormatter.format(amount)}원`;
}
