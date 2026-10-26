# 브랜치, 커밋, PR, 리뷰

## 공개된 내용 [공개]

- 트렁크 기반 개발. `main`을 라이브에 배포된 버전으로 두고, `main`에서 브랜치를 따서 개발하고 CI를 돌린 뒤 다시 `main`에 합침
- 커밋 메시지는 Conventional Commits 규칙을 따름
- 권장 PR 크기는 300~400줄 내외
- 라이브러리 개발과 서비스 개발 모두 코드 리뷰가 의무임
- 모노레포로 모든 서비스 코드를 한 레포에서 관리해서 코드 위치 파악과 리뷰가 쉬움
- 주간 챕터 미팅(Tech Talk), 공용 라이브러리 공동 개발
- es-toolkit은 PR을 squash merge하고 PR 제목을 `<type>[scope]: <description>` 형식으로 강제함. type은 `feat`, `fix`, `docs`, `test`, `chore`

## 공개되지 않은 내용 [추정]

- 브랜치 이름 규칙
- 커밋 메시지 언어. 토스 오픈소스는 영어지만 사내 서비스 레포는 알 수 없음
- 리뷰 승인 인원, 코멘트 규칙

## 이 레포의 규칙

- 브랜치: `<type>/<짧은-설명>`
- 커밋: `<type>(<scope>): <한국어 요약>`. scope는 번들이나 패키지 이름
- 머지: squash merge. PR 제목이 `main` 커밋이 됨
- 검사: 커밋 훅에서 commitlint, CI에서 PR 제목 형식 검사
- 리뷰 코멘트 의도 표시: `[필수]`, `[제안]`, `[질문]` [추정]

자세한 규칙은 [CONTRIBUTING.md](../CONTRIBUTING.md) 참고.

## 출처

- 토스 프론트엔드 챕터의 모든 것 https://tosspayments-dev.oopy.io/cc9367e4-4ff6-4241-8189-9f3cf250f5d2
- 토스 프론트엔드 챕터를 소개합니다 https://toss.tech/article/toss-frontend-chapter
- es-toolkit 기여 가이드 https://github.com/toss/es-toolkit/blob/main/.github/CONTRIBUTING.md
- 토스플레이스 Frontend Developer 공고 https://www.wanted.co.kr/wd/207573
