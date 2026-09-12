# OCR 신뢰도 하네스

인쇄체/손글씨 샘플 이미지(반드시 익명화된 더미 데이터)와 기대 추출 텍스트를 고정해, OCR
어댑터를 교체하거나 업그레이드할 때 회귀를 감지하기 위한 하네스다.

> 현재 OCR 어댑터(`src/infrastructure/ocr/`)는 아직 구현되지 않았다(`OcrPort`만 정의됨).
> 어댑터 구현 시 이 디렉터리에 `{이미지 파일, expected.json}` 쌍을 추가하고,
> `test:ocr` 스크립트와 함께 회귀 테스트를 작성한다.

## 픽스처 형식(예정)
```
test/ocr-fixtures/
  printed-sample-1/
    input.jpg
    expected.json   # { "fullText": "...", "minConfidence": 0.8 }
  handwritten-sample-1/
    input.jpg
    expected.json
```

실제 학생 시험지/상담일지 원본을 절대 사용하지 말 것 — 반드시 가상 데이터로 재구성한다.
