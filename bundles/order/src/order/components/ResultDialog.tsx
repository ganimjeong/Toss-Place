import { css } from '@emotion/react';
import { Button, vars } from '@toss-place/design-system';
import { useId } from 'react';

interface Action {
  label: string;
  onClick: () => void;
}

interface Props {
  isOpen: boolean;
  title: string;
  description: string;
  confirm: Action;
  cancel?: Action;
}

export function ResultDialog({ isOpen, title, description, confirm, cancel }: Props) {
  const titleId = useId();

  if (!isOpen) {
    return null;
  }

  return (
    <div css={dimStyle}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} css={dialogStyle}>
        <h2 id={titleId} css={titleStyle}>
          {title}
        </h2>
        <p css={descriptionStyle}>{description}</p>
        <div css={actionsStyle}>
          {cancel !== undefined && (
            <Button variant="secondary" fullWidth onClick={cancel.onClick}>
              {cancel.label}
            </Button>
          )}
          <Button fullWidth onClick={confirm.onClick}>
            {confirm.label}
          </Button>
        </div>
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

const actionsStyle = css`
  display: flex;
  gap: ${vars.spacing.x2};
`;
