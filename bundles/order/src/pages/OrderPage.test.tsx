import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMockPosBridge, type PosBridge } from '@toss-place/pos-bridge';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Providers } from '../app/Providers';
import { OrderPage } from './OrderPage';

function installPosBridge(overrides: Partial<PosBridge>) {
  const bridge = { ...createMockPosBridge(), ...overrides };
  window.posBridge = bridge;
  return bridge;
}

async function orderAmericanoAndPay() {
  render(
    <Providers>
      <OrderPage />
    </Providers>,
  );
  fireEvent.click(await screen.findByRole('button', { name: /아메리카노/ }));
  fireEvent.click(screen.getByRole('button', { name: '카드 결제' }));
}

afterEach(() => {
  delete window.posBridge;
  localStorage.clear();
});

describe('OrderPage 결제 흐름', () => {
  it('결제가 끝나면 영수증을 출력하고 결제 완료를 알림', async () => {
    const printReceipt = vi.fn<PosBridge['printReceipt']>().mockResolvedValue({
      ok: true,
      value: undefined,
    });
    installPosBridge({ printReceipt });

    await orderAmericanoAndPay();

    expect(await screen.findByRole('dialog', { name: '결제가 완료되었어요' })).toBeTruthy();
    expect(printReceipt).toHaveBeenCalledWith(
      expect.objectContaining({
        lines: [{ name: '아메리카노', quantity: 1, amount: 4500 }],
        totalAmount: 4500,
      }),
    );
  });

  it('용지가 없어서 출력이 실패하면 다시 출력할 수 있음', async () => {
    const printReceipt = vi
      .fn<PosBridge['printReceipt']>()
      .mockResolvedValueOnce({ ok: false, reason: 'PAPER_EMPTY' })
      .mockResolvedValueOnce({ ok: true, value: undefined });
    installPosBridge({ printReceipt });

    await orderAmericanoAndPay();
    await screen.findByRole('dialog', { name: '영수증을 출력하지 못했어요' });
    fireEvent.click(screen.getByRole('button', { name: '다시 출력' }));

    expect(await screen.findByRole('dialog', { name: '결제가 완료되었어요' })).toBeTruthy();
    expect(printReceipt).toHaveBeenCalledTimes(2);
  });

  it('카드사가 거절하면 영수증을 출력하지 않고 장바구니를 유지함', async () => {
    const printReceipt = vi.fn<PosBridge['printReceipt']>();
    installPosBridge({
      printReceipt,
      requestCardPayment: () => Promise.resolve({ ok: false, reason: 'DECLINED' }),
    });

    await orderAmericanoAndPay();

    expect(await screen.findByRole('dialog', { name: '결제하지 못했어요' })).toBeTruthy();
    await waitFor(() => expect(screen.getByText('아메리카노 1개')).toBeTruthy());
    expect(printReceipt).not.toHaveBeenCalled();
  });

  it('단말기 응답이 없어도 승인됐다면 다시 결제하지 않고 완료로 처리함', async () => {
    const bridge = createMockPosBridge();
    const requestCardPayment = vi.fn<PosBridge['requestCardPayment']>(async request => {
      await bridge.requestCardPayment(request);
      return { ok: false, reason: 'TIMEOUT' };
    });
    installPosBridge({ ...bridge, requestCardPayment });

    await orderAmericanoAndPay();

    expect(await screen.findByRole('dialog', { name: '결제가 완료되었어요' })).toBeTruthy();
    expect(requestCardPayment).toHaveBeenCalledTimes(1);
  });
});

describe('결제 중일 때', () => {
  it('승인을 기다리는 동안에는 메뉴를 담거나 뺄 수 없음', async () => {
    let approve: () => void = () => {};
    const bridge = createMockPosBridge();
    installPosBridge({
      ...bridge,
      requestCardPayment: request =>
        new Promise(resolve => {
          approve = () => void bridge.requestCardPayment(request).then(resolve);
        }),
    });

    await orderAmericanoAndPay();

    await waitFor(() =>
      expect(screen.getByRole('button', { name: '결제 중' })).toHaveProperty('disabled', true),
    );
    expect(screen.getByRole('button', { name: /^아메리카노\s*4,500원$/ })).toHaveProperty(
      'disabled',
      true,
    );
    expect(screen.getByRole('button', { name: '아메리카노 하나 빼기' })).toHaveProperty(
      'disabled',
      true,
    );
    approve();
    expect(await screen.findByRole('dialog', { name: '결제가 완료되었어요' })).toBeTruthy();
  });
});

describe('결제 결과를 모를 때', () => {
  /**
   * 단말기는 승인했지만 응답이 오지 않고, 조회도 단말기 연결이 끊겨 실패하는 상황.
   * connect()를 부르면 그때부터 조회가 됨.
   */
  function installUnreachableTerminal() {
    const bridge = createMockPosBridge();
    let isConnected = false;
    const printReceipt = vi.fn<PosBridge['printReceipt']>().mockResolvedValue({
      ok: true,
      value: undefined,
    });
    installPosBridge({
      ...bridge,
      printReceipt,
      requestCardPayment: async request => {
        await bridge.requestCardPayment(request);
        return { ok: false, reason: 'TIMEOUT' };
      },
      getCardPayment: key =>
        isConnected
          ? bridge.getCardPayment(key)
          : Promise.resolve({ ok: false, reason: 'DISCONNECTED' }),
    });
    return { printReceipt, connect: () => (isConnected = true) };
  }

  it('결과를 확인하기 전에는 장바구니를 바꿀 수 없어서 영수증이 승인 금액과 어긋나지 않음', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const terminal = installUnreachableTerminal();

    await orderAmericanoAndPay();
    await vi.advanceTimersByTimeAsync(10_000);
    await screen.findByRole('dialog', { name: '결제 결과를 확인하지 못했어요' });
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    // 결과를 모르는 동안 메뉴를 하나 더 담으려 함
    fireEvent.click(screen.getByRole('button', { name: /^아메리카노\s*4,500원$/ }));
    terminal.connect();
    fireEvent.click(screen.getByRole('button', { name: /카드 결제|결제 결과 확인/ }));

    await screen.findByRole('dialog', { name: '결제가 완료되었어요' });
    const [receipt] = terminal.printReceipt.mock.calls[0] ?? [];
    const lineTotal = receipt?.lines.reduce((total, line) => total + line.amount, 0);
    expect(receipt?.totalAmount).toBe(4500);
    expect(lineTotal).toBe(receipt?.totalAmount);
    vi.useRealTimers();
  });

  it('새 주문으로 넘기면 장바구니가 풀리고 이전 시도는 다음 확인을 위해 남음', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    installUnreachableTerminal();

    await orderAmericanoAndPay();
    await vi.advanceTimersByTimeAsync(10_000);
    await screen.findByRole('dialog', { name: '결제 결과를 확인하지 못했어요' });
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    fireEvent.click(screen.getByRole('button', { name: '새 주문으로 넘기기' }));
    fireEvent.click(await screen.findByRole('button', { name: '새 주문 시작' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^아메리카노\s*4,500원$/ })).toHaveProperty(
        'disabled',
        false,
      ),
    );
    expect(screen.queryByText('아메리카노 1개')).toBeNull();
    expect(localStorage.getItem('toss-place:order:payment-journal')).toContain('"amount":4500');
    vi.useRealTimers();
  });
});

describe('결제 중 화면이 닫혔을 때', () => {
  it('다시 열면 승인된 결제를 알려줌', async () => {
    const bridge = installPosBridge({});
    await bridge.requestCardPayment({ idempotencyKey: 'lost-key', orderId: 'lost', amount: 4500 });
    localStorage.setItem(
      'toss-place:order:payment-journal',
      JSON.stringify([
        {
          orderId: 'lost',
          amount: 4500,
          idempotencyKey: 'lost-key',
          startedAt: '2026-10-27T00:00:00.000Z',
        },
      ]),
    );

    render(
      <Providers>
        <OrderPage />
      </Providers>,
    );

    expect((await screen.findByRole('alert')).textContent).toContain(
      '승인된 결제가 있어요. 4,500원',
    );
  });
});
