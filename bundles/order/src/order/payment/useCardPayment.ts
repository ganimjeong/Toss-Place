import type { PaymentRequest } from '@ajinjeong/payment-sdk';
import { useMutation } from '@tanstack/react-query';

import { paymentClient } from './paymentClient';

/**
 * 중복 요청 방지와 멱등 키 관리는 SDK가 맡으므로 여기서는 요청 상태만 화면에 연결함.
 * 실패도 결과 객체로 돌아오기 때문에 mutation이 reject되는 건 저널을 쓰지 못했을 때뿐임.
 */
export function useCardPayment() {
  return useMutation({
    mutationFn: (request: PaymentRequest) => paymentClient.pay(request),
  });
}
