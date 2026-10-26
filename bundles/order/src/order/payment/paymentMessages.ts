import type { PaymentFailureReason, PaymentOutcome } from '@toss-place/payment-sdk';
import type { CardPaymentFailureReason } from '@toss-place/pos-bridge';
import { formatWon } from '@toss-place/utils';

type CardPaymentOutcome = PaymentOutcome<CardPaymentFailureReason>;

// SDK 사유까지 Record로 묶어서, 사유가 늘어나면 문구를 빠뜨린 곳을 컴파일러가 알려줌
const FAILURE_MESSAGES: Record<PaymentFailureReason<CardPaymentFailureReason>, string> = {
  DECLINED: '카드사에서 결제를 거절했어요. 다른 카드로 다시 시도해 주세요.',
  CANCELED: '결제가 취소되었어요.',
  DISCONNECTED:
    '결제 단말기 연결이 끊어졌어요. 결제되지 않았으니 연결을 확인하고 다시 시도해 주세요.',
  TIMEOUT: '결제 단말기 응답이 없었어요. 결제되지 않았으니 다시 시도해 주세요.',
  TRANSPORT_ERROR: '결제 단말기와 통신하지 못했어요. 결제되지 않았으니 다시 시도해 주세요.',
  INTERRUPTED: '결제가 중간에 멈췄어요. 결제되지 않았으니 다시 시도해 주세요.',
};

export function toPaymentMessage(outcome: CardPaymentOutcome) {
  switch (outcome.status) {
    case 'approved':
      return {
        title: '결제가 완료되었어요',
        description: `${formatWon(outcome.approval.amount)} 승인 (승인번호 ${outcome.approval.approvalNumber})`,
      };
    case 'failed':
      return { title: '결제하지 못했어요', description: FAILURE_MESSAGES[outcome.reason] };
    case 'unknown':
      // 돈이 나갔을 수도 있으므로 '다시 결제'를 권하지 않음
      return {
        title: '결제 결과를 확인하지 못했어요',
        description:
          '단말기 연결을 확인한 뒤 결제 버튼을 다시 눌러 주세요. 새로 결제하지 않고 이전 결제부터 확인해요.',
      };
  }
}

export const PAYMENT_START_FAILURE_MESSAGE = {
  title: '결제를 시작하지 못했어요',
  description: '결제 기록을 저장하지 못해서 결제를 요청하지 않았어요. 앱을 다시 시작해 주세요.',
};
