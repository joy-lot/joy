# 골든 데이터셋 회귀 하네스

실제(또는 대표) 상담 시나리오에 대해 Ollama Qwen을 직접 호출한 결과를 기록해두고, 프롬프트나
모델을 변경했을 때 결과가 어떻게 달라지는지 사람이 리뷰하기 위한 하네스다. 자동 pass/fail이
아니라 **변경 감지**가 목적이므로, 실패해도 빌드를 막지는 않는다.

## 실행 방법
1. 로컬에서 Ollama를 실행하고 `.env.local`에 `OLLAMA_BASE_URL`, `OLLAMA_MODEL`을 설정한다.
2. `RUN_GOLDEN=1 npm run test:golden`

`RUN_GOLDEN` 환경변수가 없으면 테스트는 스킵된다(CI에서 실수로 외부 서버를 호출하지 않도록).

## 시나리오 추가 방법
`scenarios/` 아래에 `*.scenario.json` 파일로 입력을 추가하고, 처음 실행한 결과를
`snapshots/`에 커밋한다. 이후 실행에서 출력이 달라지면 diff를 리뷰하고, 의도된 변경이면
스냅샷을 갱신한다.
