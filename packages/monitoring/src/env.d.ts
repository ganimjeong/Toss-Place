/**
 * 빌드할 때 @toss-place/vite-config가 넣어줌.
 * 값이 빈 문자열이면 모니터링을 켜지 않음 (로컬 개발, 테스트, DSN 없는 빌드)
 */
interface ImportMetaEnv {
  readonly SENTRY_DSN: string;
  /** 예: @toss-place/order@0.1.0. 소스맵 업로드와 같은 이름을 써야 스택이 원래 코드로 보임 */
  readonly BUNDLE_RELEASE: string;
}
