import { css } from '@emotion/react';
import { ErrorBoundary, Suspense } from '@suspensive/react';
import { vars } from '@toss-place/design-system';
import { overlay } from 'overlay-kit';
import { useState } from 'react';

import { CartPanel, type CartPaymentStatus } from '../order/components/CartPanel';
import { MenuGrid, MenuGridSkeleton } from '../order/components/MenuGrid';
import { ResultDialog } from '../order/components/ResultDialog';
import { useCart } from '../order/hooks/useCart';
import { PAYMENT_START_FAILURE_MESSAGE, toPaymentMessage } from '../order/payment/paymentMessages';
import { PendingPaymentNotice } from '../order/payment/PendingPaymentNotice';
import { useCardPayment } from '../order/payment/useCardPayment';
import { printReceiptWithRetry } from '../order/receipt/printReceiptWithRetry';
import { toReceipt } from '../order/receipt/toReceipt';

export function OrderPage() {
  const [orderId, setOrderId] = useState(createOrderId);
  const cart = useCart();
  const payment = useCardPayment();

  // 마지막 결제 결과는 주문 ID로 묶어서 봄. 새 주문을 시작하면 이전 주문의 결과에 끌려가지 않음
  const isAwaitingConfirmation =
    payment.data?.status === 'unknown' && payment.data.attempt.orderId === orderId;
  const paymentStatus = toCartPaymentStatus(payment.isPending, isAwaitingConfirmation);

  const handlePay = async () => {
    const outcome = await payment
      .mutateAsync({ orderId, amount: cart.totalAmount })
      .catch(() => null);
    if (outcome === null) {
      openResultDialog(PAYMENT_START_FAILURE_MESSAGE);
      return;
    }

    const message = toPaymentMessage(outcome);
    // 결과를 모를 때도 장바구니와 주문 번호를 그대로 두고 잠금. 다시 누르면 같은 주문의 이전 결제부터 확인함
    if (outcome.status !== 'approved') {
      openResultDialog(message);
      return;
    }

    // 장바구니를 비우기 전에 영수증 내용을 먼저 만들어 둠
    const receipt = toReceipt(orderId, cart.items, outcome.approval.amount);
    cart.clear();
    setOrderId(createOrderId());

    await printReceiptWithRetry(receipt);
    openResultDialog(message);
  };

  /**
   * 단말기가 계속 응답하지 않으면 잠금이 풀리지 않으므로 이 주문을 두고 넘어갈 길을 둠.
   * 결과를 모르는 시도는 저널에 남아 다음 실행 때 다시 조회되고, 모니터링에도 이미 경고가 감
   */
  const handleStartNewOrder = async () => {
    const confirmed = await overlay.openAsync<boolean>(({ isOpen, close }) => (
      <ResultDialog
        isOpen={isOpen}
        title="새 주문으로 넘길까요?"
        description="장바구니를 비워요. 이전 결제는 단말기 승인 내역에서 직접 확인해 주세요. 앱을 다시 열 때도 한 번 더 확인해요."
        cancel={{ label: '취소', onClick: () => close(false) }}
        confirm={{ label: '새 주문 시작', onClick: () => close(true) }}
      />
    ));
    if (!confirmed) {
      return;
    }
    cart.clear();
    setOrderId(createOrderId());
    payment.reset();
  };

  return (
    <main css={layoutStyle}>
      <ErrorBoundary fallback={<p>메뉴를 불러오지 못했어요.</p>}>
        <Suspense fallback={<MenuGridSkeleton />}>
          <MenuGrid onSelect={cart.add} disabled={paymentStatus !== 'idle'} />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <PendingPaymentNotice />
        </Suspense>
      </ErrorBoundary>
      <CartPanel
        items={cart.items}
        totalAmount={cart.totalAmount}
        paymentStatus={paymentStatus}
        onRemove={cart.remove}
        onPay={() => void handlePay()}
        onStartNewOrder={() => void handleStartNewOrder()}
      />
    </main>
  );
}

function openResultDialog(message: { title: string; description: string }) {
  overlay.open(({ isOpen, close }) => (
    <ResultDialog isOpen={isOpen} {...message} confirm={{ label: '확인', onClick: close }} />
  ));
}

function toCartPaymentStatus(
  isPending: boolean,
  isAwaitingConfirmation: boolean,
): CartPaymentStatus {
  if (isPending) {
    return 'paying';
  }
  return isAwaitingConfirmation ? 'awaiting-confirmation' : 'idle';
}

function createOrderId() {
  return crypto.randomUUID();
}

const layoutStyle = css`
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: ${vars.spacing.x5};
  height: 100vh;
  padding: ${vars.spacing.x5};
`;
