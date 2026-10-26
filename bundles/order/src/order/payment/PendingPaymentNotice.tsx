import { css } from '@emotion/react';
import { Button, vars } from '@toss-place/design-system';
import { useSuspenseQuery } from '@tanstack/react-query';
import { formatWon } from '@toss-place/utils';
import { useState } from 'react';

import { paymentClient } from './paymentClient';

/**
 * 지난번에 결과를 받지 못하고 화면이 닫힌 결제를 확인해서 알려줌.
 * 승인된 결제가 있으면 사장님이 같은 주문을 다시 결제하지 않도록 먼저 보여줌.
 */
export function PendingPaymentNotice() {
  const { data: outcomes } = useSuspenseQuery({
    queryKey: ['payment', 'recovery'],
    queryFn: () => paymentClient.recover(),
    staleTime: Infinity,
  });
  const [isDismissed, setIsDismissed] = useState(false);

  const approvals = outcomes.flatMap(outcome =>
    outcome.status === 'approved' ? [outcome.approval] : [],
  );
  const unknownCount = outcomes.filter(outcome => outcome.status === 'unknown').length;

  if (isDismissed || (approvals.length === 0 && unknownCount === 0)) {
    return null;
  }

  return (
    <section role="alert" css={noticeStyle}>
      <div>
        {approvals.map(approval => (
          <p key={approval.approvalNumber} css={lineStyle}>
            화면이 닫히기 전에 승인된 결제가 있어요. {formatWon(approval.amount)}, 승인번호{' '}
            {approval.approvalNumber}
          </p>
        ))}
        {unknownCount > 0 && (
          <p css={lineStyle}>
            결과를 확인하지 못한 결제가 {unknownCount}건 있어요. 단말기 승인 내역을 확인해 주세요.
          </p>
        )}
      </div>
      <Button size="medium" onClick={() => setIsDismissed(true)}>
        확인했어요
      </Button>
    </section>
  );
}

// 늦게 나타나도 주문 화면을 밀어내지 않도록 화면 위에 띄움
const noticeStyle = css`
  position: fixed;
  right: ${vars.spacing.x5};
  bottom: ${vars.spacing.x5};
  left: ${vars.spacing.x5};
  display: flex;
  gap: ${vars.spacing.x4};
  align-items: center;
  justify-content: space-between;
  padding: ${vars.spacing.x4} ${vars.spacing.x5};
  border: 1px solid ${vars.color.warning};
  border-radius: ${vars.radius.large};
  background: ${vars.color.bgLayered};
`;

const lineStyle = css`
  margin: 0;
  font-size: ${vars.typography.t6.fontSize};
  line-height: ${vars.typography.t6.lineHeight};
  font-variant-numeric: tabular-nums;
`;
