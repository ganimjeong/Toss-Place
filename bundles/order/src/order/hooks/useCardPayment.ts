import { getPosBridge, type CardPaymentRequest } from '@toss-place/pos-bridge';
import { useRef, useState } from 'react';

/**
 * 카드 결제 요청.
 * 결제 버튼을 여러 번 눌러도 같은 주문에는 같은 멱등 키를 써서 이중 결제를 막음.
 */
export function useCardPayment(orderId: string) {
  const idempotencyKeyRef = useRef<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const pay = async (amount: number) => {
    idempotencyKeyRef.current ??= crypto.randomUUID();
    const request: CardPaymentRequest = {
      idempotencyKey: idempotencyKeyRef.current,
      orderId,
      amount,
    };

    setIsPending(true);
    try {
      const result = await getPosBridge().requestCardPayment(request);
      if (result.ok) {
        idempotencyKeyRef.current = null;
      }
      return result;
    } finally {
      setIsPending(false);
    }
  };

  return { pay, isPending };
}
