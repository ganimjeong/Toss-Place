import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// vitest globals를 끄면 Testing Library의 자동 cleanup이 동작하지 않아서 직접 등록함
afterEach(cleanup);
