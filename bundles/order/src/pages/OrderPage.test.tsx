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
});
