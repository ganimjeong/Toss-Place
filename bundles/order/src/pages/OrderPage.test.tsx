import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMockPosBridge, type PosBridge } from '@toss-place/pos-bridge';
import { useOverlayData } from 'overlay-kit';
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

/** 닫힌 다이얼로그는 화면에 그려지지 않아서, 오버레이 목록 크기로 남아 있는지 확인함 */
function OverlayCount() {
  return <output aria-label="오버레이 수">{Object.keys(useOverlayData()).length}</output>;
}

describe('영업시간 내내 켜 두는 포스', () => {
  it('결제 결과 다이얼로그를 닫으면 오버레이 목록에서도 지움', async () => {
    installPosBridge({});
    render(
      <Providers>
        <OrderPage />
        <OverlayCount />
      </Providers>,
    );

    for (let payment = 0; payment < 3; payment++) {
      fireEvent.click(await screen.findByRole('button', { name: /아메리카노/ }));
      fireEvent.click(screen.getByRole('button', { name: '카드 결제' }));
      await screen.findByRole('dialog', { name: '결제가 완료되었어요' });
      fireEvent.click(screen.getByRole('button', { name: '확인' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    }

    expect(screen.getByLabelText('오버레이 수').textContent).toBe('0');
  });

  it('영수증 출력 실패 다이얼로그도 답한 뒤 목록에서 지움', async () => {
    installPosBridge({
      printReceipt: vi
        .fn<PosBridge['printReceipt']>()
        .mockResolvedValueOnce({ ok: false, reason: 'PAPER_EMPTY' })
        .mockResolvedValueOnce({ ok: true, value: undefined }),
    });
    render(
      <Providers>
        <OrderPage />
        <OverlayCount />
      </Providers>,
    );

    fireEvent.click(await screen.findByRole('button', { name: /아메리카노/ }));
    fireEvent.click(screen.getByRole('button', { name: '카드 결제' }));
    await screen.findByRole('dialog', { name: '영수증을 출력하지 못했어요' });
    fireEvent.click(screen.getByRole('button', { name: '다시 출력' }));
    await screen.findByRole('dialog', { name: '결제가 완료되었어요' });
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => expect(screen.getByLabelText('오버레이 수').textContent).toBe('0'));
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
