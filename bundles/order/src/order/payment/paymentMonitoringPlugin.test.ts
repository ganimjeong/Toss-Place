import type { Monitor } from '@toss-place/monitoring';
import { createPaymentClient, createMemoryJournal } from '@ganimjeong/payment-sdk';
import type { CardPaymentFailureReason } from '@toss-place/pos-bridge';
import { describe, expect, it, vi } from 'vitest';

import { createPaymentMonitoringPlugin } from './paymentMonitoringPlugin';

function createFakeMonitor() {
  return {
    addBreadcrumb: vi.fn<Monitor['addBreadcrumb']>(),
    captureMessage: vi.fn<Monitor['captureMessage']>(),
  };
}

function createClient(target: Monitor, lookupFails: boolean) {
  return createPaymentClient<CardPaymentFailureReason>({
    transport: {
      approve: () => Promise.resolve({ ok: false, reason: 'TIMEOUT' }),
      lookup: () =>
        Promise.resolve(
          lookupFails
            ? { ok: false, reason: 'DISCONNECTED' }
            : { ok: true, value: { status: 'not-found' } },
        ),
    },
    isAmbiguous: reason => reason === 'TIMEOUT' || reason === 'DISCONNECTED',
    journal: createMemoryJournal(),
    reconcile: { maxAttempts: 1 },
    plugins: [createPaymentMonitoringPlugin(target)],
  });
}

describe('createPaymentMonitoringPlugin', () => {
  it('결과를 모르는 결제는 단말기 내역과 맞춰볼 정보를 담아 경고로 보냄', async () => {
    const fake = createFakeMonitor();

    await createClient(fake, true).pay({ orderId: 'order-1', amount: 4500 });

    expect(fake.captureMessage).toHaveBeenCalledTimes(1);
    const [message, context] = fake.captureMessage.mock.calls[0] ?? [];
    expect(message).toBe('결제 결과를 확인하지 못함');
    expect(context?.level).toBe('warning');
    expect(context?.tags).toEqual({ 'payment.reason': 'DISCONNECTED' });
    expect(context?.fingerprint).toEqual(['payment-unknown', 'DISCONNECTED']);
    expect(context?.extra).toMatchObject({ orderId: 'order-1', amount: 4500 });
    expect(typeof context?.extra?.idempotencyKey).toBe('string');
  });

  it('결제되지 않음이 확인되면 이벤트 없이 흐름만 남김', async () => {
    const fake = createFakeMonitor();

    await createClient(fake, false).pay({ orderId: 'order-1', amount: 4500 });

    expect(fake.captureMessage).not.toHaveBeenCalled();
    expect(fake.addBreadcrumb.mock.calls.map(([, message]) => message)).toEqual([
      'idle -> requesting',
      'requesting -> reconciling',
      'reconciling -> failed',
    ]);
  });
});
