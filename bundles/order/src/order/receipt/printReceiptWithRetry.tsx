import { getPosBridge, type Receipt, type ReceiptPrintFailureReason } from '@toss-place/pos-bridge';
import { overlay } from 'overlay-kit';

import { ResultDialog } from '../components/ResultDialog';

const PRINT_FAILURE_MESSAGES: Record<ReceiptPrintFailureReason, string> = {
  PAPER_EMPTY: '영수증 용지가 없어요. 용지를 넣고 다시 출력해 주세요.',
  DISCONNECTED: '프린터 연결이 끊어졌어요. 연결 상태를 확인해 주세요.',
  TIMEOUT: '프린터가 응답하지 않아요. 잠시 후 다시 출력해 주세요.',
};

/**
 * 결제는 이미 끝났으므로 출력 실패가 주문 흐름을 막으면 안 됨.
 * 실패하면 사유를 보여주고, 사장님이 다시 출력하거나 건너뛸 수 있게 함.
 */
export async function printReceiptWithRetry(receipt: Receipt): Promise<boolean> {
  for (;;) {
    const result = await getPosBridge().printReceipt(receipt);
    if (result.ok) {
      return true;
    }

    const shouldRetry = await overlay.openAsync<boolean>(({ isOpen, close }) => (
      <ResultDialog
        isOpen={isOpen}
        title="영수증을 출력하지 못했어요"
        description={PRINT_FAILURE_MESSAGES[result.reason]}
        cancel={{ label: '건너뛰기', onClick: () => close(false) }}
        confirm={{ label: '다시 출력', onClick: () => close(true) }}
      />
    ));
    if (!shouldRetry) {
      return false;
    }
  }
}
