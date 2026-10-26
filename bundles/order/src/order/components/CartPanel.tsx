import { css } from '@emotion/react';
import { Button, vars } from '@toss-place/design-system';
import { formatWon } from '@toss-place/utils';

import type { CartItem } from '../models';

interface Props {
  items: readonly CartItem[];
  totalAmount: number;
  isPaying: boolean;
  onRemove: (menuId: string) => void;
  onPay: () => void;
}

export function CartPanel({ items, totalAmount, isPaying, onRemove, onPay }: Props) {
  const isEmpty = items.length === 0;

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

      <Button fullWidth disabled={isEmpty || isPaying} onClick={onPay}>
        {isPaying ? '결제 중' : '카드 결제'}
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
