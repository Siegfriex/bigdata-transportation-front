# 전략 근거 리포트 Sheet 설계

## 적용 패턴

지도 맥락을 유지해야 하므로 리포트는 별도 페이지보다 bottom sheet overlay가 적합하다. 모바일에서는 full-width sheet로 표시하고, 배경 지도는 dim 처리해 현재 맥락을 유지한다.

## 와이어프레임

```text
Map background
└─ dim backdrop
   └─ Strategy Report Bottom Sheet
      ├─ grabber
      ├─ header
      │  ├─ 실시간 전략 리포트 badge
      │  ├─ title: 왜 이 경로가 선택됐는지
      │  └─ route/deadline context
      ├─ route condition compact controls
      ├─ report type segmented tabs
      ├─ strategy candidate carousel
      │  ├─ 전략 1 card
      │  ├─ 전략 2 card
      │  └─ 전략 3 card
      ├─ selected strategy explanation
      │  ├─ summary
      │  ├─ delay risk bar
      │  ├─ crowd pressure bar
      │  ├─ confidence bar
      │  └─ evidence cards
      ├─ movement timeline
      └─ footer actions
         ├─ 전략 저장
         └─ AI 근거 질문
```

## UX 원칙

- 전략 선택은 페이지 이동 없이 같은 sheet 안에서 즉시 갱신한다.
- 사용자는 지도 맥락을 잃지 않는다.
- 경로 후보는 carousel로 훑고, 선택 후 근거는 bar/timeline/evidence card로 설명한다.
- “전술” 같은 과장된 표현보다 “전략”, “근거”, “저장”처럼 실제 사용 행동에 맞는 문구를 쓴다.
- 리포트는 결과만 보여주지 않고 “왜 도출됐는지”를 숫자와 단계로 설명한다.

## 참고 패턴

- Material Design bottom sheets: 모바일에서 하단에서 올라오는 보조 콘텐츠 패턴.
- 지도/위치 맥락: persistent/standard sheet가 배경 지도와 함께 쓰기 적합하다.
- modal sheet: 현재 판단에 집중시키기 위해 backdrop과 높은 elevation을 사용한다.
