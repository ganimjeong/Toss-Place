import { css } from '@emotion/react';
import { ErrorBoundary, Suspense } from '@suspensive/react';
import { vars } from '@toss-place/design-system';
import { overlay } from 'overlay-kit';
import { useState } from 'react';

import { CartPanel } from '../order/components/CartPanel';
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

  const handlePay = async () => {
    const outcome = await payment
      .mutateAsync({ orderId, amount: cart.totalAmount })
      .catch(() => null);
    if (outcome === null) {
      openResultDialog(PAYMENT_START_FAILURE_MESSAGE);
      return;
    }

    const message = toPaymentMessage(outcome);
    // 결과를 모를 때도 장바구니와 주문 번호를 그대로 둠. 다시 누르면 같은 주문의 이전 결제부터 확인함
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

  return (
    <main css={layoutStyle}>
      <ErrorBoundary fallback={<p>메뉴를 불러오지 못했어요.</p>}>
        <Suspense fallback={<MenuGridSkeleton />}>
          <MenuGrid onSelect={cart.add} />
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
        isPaying={payment.isPending}
        onRemove={cart.remove}
        onPay={() => void handlePay()}
      />
    </main>
  );
}

function openResultDialog(message: { title: string; description: string }) {
  overlay.open(({ isOpen, close }) => (
    <ResultDialog isOpen={isOpen} {...message} confirm={{ label: '확인', onClick: close }} />
  ));
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
