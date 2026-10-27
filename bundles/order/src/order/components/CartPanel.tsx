import { css } from '@emotion/react';
import { Button, vars } from '@toss-place/design-system';
import { formatWon } from '@toss-place/utils';

import type { CartItem } from '../models';

/**
 * 장바구니 기준의 결제 진행 상태.
 * 결제 중이면서 확인 대기인 조합은 없으므로 boolean 두 개 대신 하나로 받음
 */
export type CartPaymentStatus = 'idle' | 'paying' | 'awaiting-confirmation';

interface Props {
  items: readonly CartItem[];
  totalAmount: number;
  paymentStatus: CartPaymentStatus;
  onRemove: (menuId: string) => void;
  onPay: () => void;
  onStartNewOrder: () => void;
}

const PAY_BUTTON_LABELS: Record<CartPaymentStatus, string> = {
  idle: '카드 결제',
  paying: '결제 중',
  // 새로 결제하지 않고 이전 결제부터 조회한다는 걸 버튼에서 드러냄
  'awaiting-confirmation': '결제 결과 확인',
};

export function CartPanel({
  items,
  totalAmount,
  paymentStatus,
  onRemove,
  onPay,
  onStartNewOrder,
}: Props) {
  const isEmpty = items.length === 0;
  const isLocked = paymentStatus !== 'idle';

  return (
    <section css={panelStyle} aria-label="장바구니">
      <ul css={listStyle}>
        {items.map(({ menu, quantity }) => (
          <li key={menu.id} css={rowStyle}>
            <span>
              {menu.name} {quantity}개
            </span>
            <span css={amountStyle}>{formatWon(menu.price * quantity)}</span>
            <Button
              variant="secondary"
              size="medium"
              aria-label={`${menu.name} 하나 빼기`}
              disabled={isLocked}
              onClick={() => onRemove(menu.id)}
            >
              빼기
            </Button>
          </li>
        ))}
      </ul>

      <div css={totalStyle}>
        <span>합계</span>
        <span css={amountStyle}>{formatWon(totalAmount)}</span>
      </div>

      {paymentStatus === 'awaiting-confirmation' && (
        <div role="status" css={lockNoticeStyle}>
          <p css={lockMessageStyle}>이전 결제가 승인됐는지 확인할 때까지 주문을 바꿀 수 없어요.</p>
          <Button variant="secondary" size="medium" onClick={onStartNewOrder}>
            새 주문으로 넘기기
          </Button>
        </div>
      )}

      <Button fullWidth disabled={isEmpty || paymentStatus === 'paying'} onClick={onPay}>
        {PAY_BUTTON_LABELS[paymentStatus]}
      </Button>
    </section>
  );
}

const panelStyle = css`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: ${vars.spacing.x5};
  border-radius: ${vars.radius.large};
  background: ${vars.color.bgSurface};
`;

const listStyle = css`
  flex: 1;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
`;

const rowStyle = css`
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: ${vars.spacing.x3};
  min-height: ${vars.size.touchTarget};
  font-size: ${vars.typography.t6.fontSize};
  line-height: ${vars.typography.t6.lineHeight};
  border-bottom: 1px solid ${vars.color.borderSubtle};
`;

const amountStyle = css`
  font-variant-numeric: tabular-nums;
`;

const totalStyle = css`
  display: flex;
  justify-content: space-between;
  padding: ${vars.spacing.x4} 0;
  font-size: ${vars.typography.t3.fontSize};
  line-height: ${vars.typography.t3.lineHeight};
  font-weight: ${vars.fontWeight.bold};
`;

const lockNoticeStyle = css`
  display: flex;
  flex-direction: column;
  gap: ${vars.spacing.x2};
  margin-bottom: ${vars.spacing.x3};
`;

const lockMessageStyle = css`
  margin: 0;
  font-size: ${vars.typography.t7.fontSize};
  line-height: ${vars.typography.t7.lineHeight};
  color: ${vars.color.textSecondary};
`;
