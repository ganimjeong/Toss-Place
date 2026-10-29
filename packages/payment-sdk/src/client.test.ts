import { afterEach, describe, expect, it, vi } from 'vitest';

import { createPaymentClient, type PaymentClientOptions } from './client';
import { createMemoryJournal } from './journal';
import { definePaymentPlugin, type PaymentStateChange } from './plugin';
import type {
  PaymentApproval,
  PaymentAttempt,
  PaymentLookup,
  PaymentTransport,
  Result,
} from './types';

type Reason = 'DECLINED' | 'TIMEOUT';

/**
 * 멱등 키를 지키는 가짜 단말기.
 * approve가 응답을 잃어버려도 단말기 쪽에는 승인이 남는 상황을 재현할 수 있음.
 */
function createFakeTerminal() {
  const approvals = new Map<string, PaymentApproval>();

  const approveOnTerminal = (attempt: PaymentAttempt) => {
    const approval = approvals.get(attempt.idempotencyKey) ?? {
      approvalNumber: String(approvals.size + 1).padStart(8, '0'),
      approvedAt: '2026-10-27T00:00:00.000Z',
      amount: attempt.amount,
    };
    approvals.set(attempt.idempotencyKey, approval);
    return approval;
  };

  const transport = {
    approve: vi.fn<PaymentTransport<Reason>['approve']>(attempt =>
      Promise.resolve({ ok: true, value: approveOnTerminal(attempt) }),
    ),
    lookup: vi.fn<PaymentTransport<Reason>['lookup']>(key => {
      const approval = approvals.get(key);
      const value: PaymentLookup =
        approval === undefined ? { status: 'not-found' } : { status: 'approved', approval };
      return Promise.resolve({ ok: true, value });
    }),
  };

  return { transport, approveOnTerminal };
}

function setup(overrides: Partial<PaymentClientOptions<Reason>> = {}) {
  const terminal = createFakeTerminal();
  const journal = overrides.journal ?? createMemoryJournal();
  let keyCount = 0;
  const client = createPaymentClient<Reason>({
    transport: terminal.transport,
    isAmbiguous: reason => reason === 'TIMEOUT',
    journal,
    createIdempotencyKey: () => `key-${++keyCount}`,
    reconcile: { maxAttempts: 3, delayMs: () => 1000 },
    ...overrides,
  });
  return { client, journal, ...terminal };
}

const order = { orderId: 'order-1', amount: 4500 };
const timeout: Result<PaymentApproval, Reason> = { ok: false, reason: 'TIMEOUT' };

afterEach(() => {
  vi.useRealTimers();
});

describe('pay', () => {
  it('승인되면 저널을 비움', async () => {
    const { client, journal } = setup();

    const outcome = await client.pay(order);

    expect(outcome.status).toBe('approved');
    expect(await journal.list()).toEqual([]);
  });

  it('결제 버튼을 연달아 눌러도 단말기에는 한 번만 요청함', async () => {
    const { client, transport } = setup();

    const [first, second] = await Promise.all([client.pay(order), client.pay(order)]);

    expect(transport.approve).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
  });

  it('카드사 거절처럼 확실한 실패는 조회하지 않고, 다시 결제할 때 새 멱등 키를 씀', async () => {
    const { client, transport } = setup();
    transport.approve.mockResolvedValueOnce({ ok: false, reason: 'DECLINED' });

    const declined = await client.pay(order);
    await client.pay(order);

    expect(declined).toMatchObject({ status: 'failed', reason: 'DECLINED' });
    expect(transport.lookup).not.toHaveBeenCalled();
    expect(transport.approve.mock.calls.map(([attempt]) => attempt.idempotencyKey)).toEqual([
      'key-1',
      'key-2',
    ]);
  });

  it('응답이 없었지만 단말기에서 승인됐다면 다시 요청하지 않고 승인으로 확정함', async () => {
    const { client, transport, approveOnTerminal } = setup();
    transport.approve.mockImplementationOnce(attempt => {
      approveOnTerminal(attempt);
      return Promise.resolve(timeout);
    });

    const outcome = await client.pay(order);

    expect(outcome.status).toBe('approved');
    expect(transport.approve).toHaveBeenCalledTimes(1);
  });

  it('손님이 카드를 대는 중이면 처리가 끝날 때까지 다시 조회함', async () => {
    vi.useFakeTimers();
    const { client, transport, approveOnTerminal } = setup();
    let pendingAttempt: PaymentAttempt | undefined;
    transport.approve.mockImplementationOnce(attempt => {
      pendingAttempt = attempt;
      return Promise.resolve(timeout);
    });
    transport.lookup.mockImplementationOnce(() => {
      // 첫 조회 뒤에 손님이 카드를 댐
      if (pendingAttempt !== undefined) {
        approveOnTerminal(pendingAttempt);
      }
      return Promise.resolve({ ok: true, value: { status: 'processing' } });
    });

    const pending = client.pay(order);
    await vi.advanceTimersByTimeAsync(1000);

    expect((await pending).status).toBe('approved');
    expect(transport.lookup).toHaveBeenCalledTimes(2);
  });

  it('조회해서 승인 내역이 없으면 원래 사유로 실패를 확정함', async () => {
    const { client, transport, journal } = setup();
    transport.approve.mockResolvedValueOnce(timeout);

    const outcome = await client.pay(order);

    expect(outcome).toMatchObject({ status: 'failed', reason: 'TIMEOUT' });
    expect(await journal.list()).toEqual([]);
  });

  it('조회도 계속 실패하면 결과를 모름으로 남기고 저널을 지우지 않음', async () => {
    vi.useFakeTimers();
    const { client, transport, journal } = setup();
    transport.approve.mockResolvedValueOnce(timeout);
    transport.lookup.mockResolvedValue({ ok: false, reason: 'TIMEOUT' });

    const pending = client.pay(order);
    await vi.advanceTimersByTimeAsync(2000);

    expect(await pending).toMatchObject({ status: 'unknown', reason: 'TIMEOUT' });
    expect(transport.lookup).toHaveBeenCalledTimes(3);
    expect(await journal.get('order-1')).toBeDefined();
    expect(client.getState('order-1').status).toBe('unknown');
  });

  it('결과를 모르는 결제가 나중에 승인으로 확인되면 같은 주문으로 새 결제를 만들지 않음', async () => {
    vi.useFakeTimers();
    const { client, transport, approveOnTerminal } = setup();
    transport.approve.mockImplementationOnce(attempt => {
      approveOnTerminal(attempt);
      return Promise.resolve(timeout);
    });
    transport.lookup.mockResolvedValueOnce({ ok: false, reason: 'TIMEOUT' });
    transport.lookup.mockResolvedValueOnce({ ok: false, reason: 'TIMEOUT' });
    transport.lookup.mockResolvedValueOnce({ ok: false, reason: 'TIMEOUT' });

    const first = client.pay(order);
    await vi.advanceTimersByTimeAsync(2000);
    expect((await first).status).toBe('unknown');

    // 단말기가 다시 연결된 뒤 사장님이 결제 버튼을 다시 누름
    const retried = await client.pay(order);

    expect(retried.status).toBe('approved');
    expect(transport.approve).toHaveBeenCalledTimes(1);
  });

  it('다시 눌러도 이전 결제를 여전히 확인할 수 없으면 새로 요청하지 않고 이전 시도를 지킴', async () => {
    vi.useFakeTimers();
    const { client, transport, journal } = setup();
    transport.approve.mockResolvedValueOnce(timeout);
    transport.lookup.mockResolvedValue({ ok: false, reason: 'TIMEOUT' });

    const first = client.pay(order);
    await vi.advanceTimersByTimeAsync(2000);
    await first;
    const retried = client.pay(order);
    await vi.advanceTimersByTimeAsync(2000);

    expect((await retried).status).toBe('unknown');
    expect(transport.approve).toHaveBeenCalledTimes(1);
    expect(await journal.get('order-1')).toMatchObject({ idempotencyKey: 'key-1' });
  });

  it('transport가 예외를 던지면 응답 없음과 같게 보고 조회함', async () => {
    const { client, transport } = setup();
    transport.approve.mockRejectedValueOnce(new Error('IPC 채널이 닫힘'));

    const outcome = await client.pay(order);

    expect(outcome).toMatchObject({ status: 'failed', reason: 'TRANSPORT_ERROR' });
    expect(transport.lookup).toHaveBeenCalledTimes(1);
  });

  it('저널에 기록하지 못하면 단말기에 결제를 요청하지 않음', async () => {
    const journal = createMemoryJournal();
    vi.spyOn(journal, 'save').mockRejectedValueOnce(new Error('QuotaExceededError'));
    const { client, transport } = setup({ journal });

    await expect(client.pay(order)).rejects.toThrow('QuotaExceededError');
    expect(transport.approve).not.toHaveBeenCalled();
  });

  it('금액이 1원 이상의 정수가 아니면 요청하지 않음', () => {
    const { client } = setup();

    expect(() => client.pay({ orderId: 'order-1', amount: 0.5 })).toThrow(RangeError);
  });
});

describe('recover', () => {
  it('결제 도중 화면이 닫혀도 다음 실행 때 승인 내역을 찾아냄', async () => {
    const journal = createMemoryJournal();
    const before = setup({ journal });
    // 단말기는 승인했지만 응답이 오기 전에 화면이 닫힘
    before.transport.approve.mockImplementationOnce(attempt => {
      before.approveOnTerminal(attempt);
      return new Promise(() => {});
    });
    void before.client.pay(order);
    await vi.waitFor(async () => expect(await journal.list()).toHaveLength(1));

    const after = createPaymentClient<Reason>({
      transport: before.transport,
      isAmbiguous: reason => reason === 'TIMEOUT',
      journal,
    });
    const outcomes = await after.recover();

    expect(outcomes).toEqual([expect.objectContaining({ status: 'approved' })]);
    expect(await journal.list()).toEqual([]);
  });

  it('승인 내역이 없으면 INTERRUPTED로 실패를 확정함', async () => {
    const { client, journal } = setup();
    await journal.save({ ...order, idempotencyKey: 'lost', startedAt: '2026-10-27T00:00:00.000Z' });

    const outcomes = await client.recover();

    expect(outcomes).toEqual([
      expect.objectContaining({ status: 'failed', reason: 'INTERRUPTED' }),
    ]);
  });
});

describe('plugins', () => {
  it('상태가 바뀔 때마다 이전 상태와 다음 상태를 알려줌', async () => {
    const onStateChange = vi.fn<(change: PaymentStateChange<Reason>) => void>();
    const { client } = setup({ plugins: [definePaymentPlugin({ name: 'spy', onStateChange })] });

    await client.pay(order);

    expect(onStateChange.mock.calls.map(([change]) => change.next.status)).toEqual([
      'requesting',
      'approved',
    ]);
  });

  it('플러그인이 실패해도 결제 결과는 바뀌지 않음', async () => {
    const onPluginError = vi.fn();
    const { client } = setup({ onPluginError });
    client.use(
      definePaymentPlugin({
        name: 'broken',
        onStateChange: () => {
          throw new Error('리포팅 서버 장애');
        },
      }),
    );
    client.use(
      definePaymentPlugin({
        name: 'rejected',
        onStateChange: () => Promise.reject(new Error('비동기 실패')),
      }),
    );

    const outcome = await client.pay(order);

    expect(outcome.status).toBe('approved');
    await vi.waitFor(() => expect(onPluginError).toHaveBeenCalledTimes(4));
  });

  it('해제한 플러그인에는 더 알리지 않음', async () => {
    const onStateChange = vi.fn();
    const { client } = setup();
    const unregister = client.use(definePaymentPlugin({ name: 'spy', onStateChange }));

    unregister();
    await client.pay(order);

    expect(onStateChange).not.toHaveBeenCalled();
  });
});

describe('영업시간 내내 켜 두는 포스', () => {
  const payOrders = async (client: ReturnType<typeof setup>['client'], count: number) => {
    for (let index = 1; index <= count; index += 1) {
      await client.pay({ orderId: `order-${index}`, amount: 4500 });
    }
  };

  it('확정된 주문의 상태는 최근 건수만 남김', async () => {
    const { client } = setup({ settledStateLimit: 3 });

    await payOrders(client, 5);

    expect(client.getState('order-1').status).toBe('idle');
    expect(client.getState('order-2').status).toBe('idle');
    expect(client.getState('order-3').status).toBe('approved');
    expect(client.getState('order-5').status).toBe('approved');
  });

  it('결과를 모르는 주문은 확정된 주문이 아무리 쌓여도 지우지 않음', async () => {
    vi.useFakeTimers();
    const { client, transport } = setup({ settledStateLimit: 3 });
    transport.approve.mockResolvedValueOnce(timeout);
    transport.lookup.mockResolvedValueOnce({ ok: false, reason: 'TIMEOUT' });
    transport.lookup.mockResolvedValueOnce({ ok: false, reason: 'TIMEOUT' });
    transport.lookup.mockResolvedValueOnce({ ok: false, reason: 'TIMEOUT' });
    const lost = client.pay({ orderId: 'lost', amount: 4500 });
    await vi.advanceTimersByTimeAsync(2000);
    await lost;

    await payOrders(client, 10);

    expect(client.getState('lost').status).toBe('unknown');
  });

  it('상태를 지운 주문을 다시 결제해도 확정 상태였을 때와 똑같이 새로 요청함', async () => {
    const { client, transport } = setup({ settledStateLimit: 1 });
    await payOrders(client, 2);

    const outcome = await client.pay({ orderId: 'order-1', amount: 4500 });

    expect(outcome.status).toBe('approved');
    expect(transport.approve).toHaveBeenCalledTimes(3);
  });
});
