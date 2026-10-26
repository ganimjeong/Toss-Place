export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 한글 요약을 쓰기 때문에 대소문자 규칙은 끔
    'subject-case': [0],
    'header-max-length': [2, 'always', 72],
  },
};
