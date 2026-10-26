import { css } from '@emotion/react';
import { Button, vars } from '@toss-place/design-system';
import { formatWon } from '@toss-place/utils';

import { DENOMINATIONS, isBill, type CashCount, type Denomination } from '../denominations';

interface Props {
  count: CashCount;
  onChange: (denomination: Denomination, quantity: number) => void;
}

export function CashCountForm({ count, onChange }: Props) {
  return (
    <ul css={listStyle}>
      {DENOMINATIONS.map(denomination => {
        const quantity = count[denomination];
        const label = `${formatWon(denomination)} ${isBill(denomination) ? '지폐' : '동전'}`;

        return (
          <li key={denomination} css={rowStyle}>
            <span css={labelStyle}>{label}</span>
            <Button
              variant="secondary"
              size="medium"
              aria-label={`${label} 한 장 빼기`}
              disabled={quantity === 0}
              onClick={() => onChange(denomination, quantity - 1)}
            >
              -
            </Button>
            <input
              css={inputStyle}
              inputMode="numeric"
              aria-label={`${label} 장수`}
              value={quantity}
              onChange={event => onChange(denomination, parseQuantity(event.target.value))}
            />
            <Button
              variant="secondary"
              size="medium"
              aria-label={`${label} 한 장 더하기`}
              onClick={() => onChange(denomination, quantity + 1)}
            >
              +
            </Button>
            <span css={subtotalStyle}>{formatWon(denomination * quantity)}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** 숫자가 아닌 입력은 버리고 0 이상의 정수만 남김 */
function parseQuantity(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits === '' ? 0 : Number(digits);
}

const listStyle = css`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const rowStyle = css`
  display: grid;
  grid-template-columns: 1fr auto 96px auto 140px;
  align-items: center;
  gap: ${vars.spacing.x2};
  min-height: ${vars.size.touchTarget};
  border-bottom: 1px solid ${vars.color.borderSubtle};
`;

const labelStyle = css`
  font-size: ${vars.typography.t6.fontSize};
  line-height: ${vars.typography.t6.lineHeight};
`;

const inputStyle = css`
  height: 40px;
  border: 1px solid ${vars.color.borderStrong};
  border-radius: ${vars.radius.small};
  font-size: ${vars.typography.t6.fontSize};
  text-align: center;
  font-variant-numeric: tabular-nums;
`;

const subtotalStyle = css`
  text-align: right;
  font-size: ${vars.typography.t6.fontSize};
  color: ${vars.color.textSecondary};
  font-variant-numeric: tabular-nums;
`;
