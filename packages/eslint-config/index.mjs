import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * 팀 공통 규칙. 규칙 추가 시 CONTRIBUTING.md의 그라운드 룰도 같이 고쳐야 함.
 */
export function createConfig({ ignores = [] } = {}) {
  return tseslint.config(
    { ignores: ['**/dist/**', '**/coverage/**', '.yarn/**', ...ignores] },

    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        parserOptions: { projectService: true },
        globals: { ...globals.browser, ...globals.node },
      },
      rules: {
        // 타입을 속이는 코드 금지. 꼭 필요하면 eslint-disable 주석에 이유를 남겨야 함
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-non-null-assertion': 'error',
        '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
        '@typescript-eslint/consistent-type-imports': 'error',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

        // 위에서 아래로 읽히는 코드
        'no-nested-ternary': 'error',
        eqeqeq: ['error', 'always'],
        curly: ['error', 'all'],

        // 숨은 로직 드러내기. 디버깅 로그는 남기지 않음
        'no-console': ['error', { allow: ['warn', 'error'] }],
      },
    },

    {
      files: ['**/*.tsx'],
      plugins: { 'react-hooks': reactHooks },
      rules: reactHooks.configs.recommended.rules,
    },
    {
      files: ['**/*.tsx'],
      ...jsxA11y.flatConfigs.recommended,
    },

    {
      // 번들 간 직접 참조 금지. 공통 코드는 packages로 올림
      files: ['bundles/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: [
                  '**/bundles/*',
                  '@toss-place/order',
                  '@toss-place/payment',
                  '@toss-place/cash',
                ],
                message: '번들 간 직접 참조는 금지입니다. 공통 코드는 packages로 옮겨 주세요.',
              },
              {
                group: ['@sentry/*'],
                message:
                  '모니터링은 @toss-place/monitoring을 거쳐 주세요. 수집 정책을 한곳에서 관리합니다.',
              },
            ],
          },
        ],
      },
    },

    {
      // 결제는 SDK를 거쳐야 멱등 키, 저널, 결과 조회가 붙음. 단말기 결제를 바로 부르면 이중 결제를 막을 수 없음
      files: ['bundles/**/*.{ts,tsx}'],
      ignores: ['**/paymentClient.ts', '**/*.test.{ts,tsx}'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: "MemberExpression[property.name='requestCardPayment']",
            message: '카드 결제는 @toss-place/payment-sdk의 pay로 요청해 주세요.',
          },
        ],
      },
    },

    {
      files: ['**/*.mjs', '**/*.config.ts'],
      ...tseslint.configs.disableTypeChecked,
    },

    prettier,
  );
}
