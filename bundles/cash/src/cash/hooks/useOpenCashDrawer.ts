import { getPosBridge } from '@toss-place/pos-bridge';
import { useState } from 'react';

const FAILURE_MESSAGES = {
  DISCONNECTED: '금전함 연결이 끊어졌어요. 연결 상태를 확인해 주세요.',
  TIMEOUT: '금전함이 응답하지 않아요. 잠시 후 다시 시도해 주세요.',
} as const;

export function useOpenCashDrawer() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const open = async () => {
    const result = await getPosBridge().openCashDrawer();
    setErrorMessage(result.ok ? null : FAILURE_MESSAGES[result.reason]);
  };

  return { open, errorMessage };
}
