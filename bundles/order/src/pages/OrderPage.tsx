import { css } from '@emotion/react';
import { ErrorBoundary, Suspense } from '@suspensive/react';
import { vars } from '@toss-place/design-system';
import { overlay } from 'overlay-kit';
import { useState } from 'react';

import { CartPanel } from '../order/components/CartPanel';
import { MenuGrid, MenuGridSkeleton } from '../order/components/MenuGrid';
import { PaymentResultDialog } from '../order/components/PaymentResultDialog';
import { useCardPayment } from '../order/hooks/useCardPayment';
import { useCart } from '../order/hooks/useCart';
import { toPaymentMessage } from '../order/paymentMessages';

export function OrderPage() {
  const [orderId, setOrderId] = useState(createOrderId);
  const cart = useCart();
  const payment = useCardPayment(orderId);

  const handlePay = async () => {
    const result = await payment.pay(cart.totalAmount);
    const message = toPaymentMessage(result);

    if (result.ok) {
      cart.clear();
      setOrderId(createOrderId());
    }

    overlay.open(({ isOpen, close }) => (
      <PaymentResultDialog isOpen={isOpen} onClose={close} {...message} />
    ));
  };

  return (
    <main css={layoutStyle}>
      <ErrorBoundary fallback={<p>메뉴를 불러오지 못했어요.</p>}>
        <Suspense fallback={<MenuGridSkeleton />}>
          <MenuGrid onSelect={cart.add} />
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
