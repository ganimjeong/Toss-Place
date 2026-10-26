import { css } from '@emotion/react';
import { vars } from '@toss-place/design-system';

interface Props {
  isOpen: boolean;
  title: string;
  description: string;
  onClose: () => void;
}

export function PaymentResultDialog({ isOpen, title, description, onClose }: Props) {
  if (!isOpen) {
    return null;
  }

  return (
    <div css={dimStyle}>
      <div role="dialog" aria-modal="true" aria-labelledby="payment-result-title" css={dialogStyle}>
        <h2 id="payment-result-title" css={titleStyle}>
          {title}
        </h2>
        <p css={descriptionStyle}>{description}</p>
        <button type="button" css={closeButtonStyle} onClick={onClose}>
          확인
        </button>
      </div>
    </div>
  );
}

const dimStyle = css`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 40%);
`;

const dialogStyle = css`
  width: 400px;
  padding: ${vars.spacing.x6};
  border-radius: ${vars.radius.large};
  background: ${vars.color.bgLayered};
`;

const titleStyle = css`
  margin: 0 0 ${vars.spacing.x2};
  font-size: ${vars.typography.t3.fontSize};
  line-height: ${vars.typography.t3.lineHeight};
`;

const descriptionStyle = css`
  margin: 0 0 ${vars.spacing.x6};
  font-size: ${vars.typography.t6.fontSize};
  line-height: ${vars.typography.t6.lineHeight};
  color: ${vars.color.textSecondary};
`;

const closeButtonStyle = css`
  width: 100%;
  min-height: ${vars.size.touchTarget};
  border: none;
  border-radius: ${vars.radius.medium};
  background: ${vars.color.primary};
  color: ${vars.color.textOnPrimary};
  font-size: ${vars.typography.t5.fontSize};
  cursor: pointer;
`;
