import type { CardPaymentFailureReason, CardPaymentResult } from '@toss-place/pos-bridge';
import { formatWon } from '@toss-place/utils';

const FAILURE_MESSAGES: Record<CardPaymentFailureReason, string> = {
  DECLINED: '카드사에서 결제를 거절했어요. 다른 카드로 다시 시도해 주세요.',
  CANCELED: '결제가 취소되었어요.',
  DISCONNECTED: '결제 단말기 연결이 끊어졌어요. 연결 상태를 확인해 주세요.',
  TIMEOUT: '결제 단말기 응답이 없어요. 잠시 후 다시 시도해 주세요.',
};

export function toPaymentMessage(result: CardPaymentResult) {
  if (result.ok) {
    return {
      title: '결제가 완료되었어요',
      description: `${formatWon(result.value.amount)} 승인 (승인번호 ${result.value.approvalNumber})`,
    };
  }
  return { title: '결제하지 못했어요', description: FAILURE_MESSAGES[result.reason] };
}
