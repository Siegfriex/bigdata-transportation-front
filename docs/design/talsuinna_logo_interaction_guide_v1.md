# 탈수있나 로고 v1 인터랙션 가이드

## 기준

이번 SVG는 `main_logo_v1.png`의 검은 실루엣을 직접 트레이싱한 버전이다. 이전 SVG처럼 임의 재해석하지 않고, 현재 사용자가 선택한 로고의 열차·레일·판단 노드·워드마크 비례를 유지한다.

## 브랜드 아이디어

`탈수있나?`는 단순 대중교통 앱명이 아니라 사용자가 던지는 판단 질문이다. 그래서 로고 구조는 다음처럼 읽힌다.

- 상단 열차: 지금 이동 중인 실시간 대중교통.
- 중앙 레일: 후보 경로와 시간축.
- 우측 원형 노드: “탈 수 있음 / 아슬아슬 / 못 탐”을 판정하는 지점.
- 워드마크 물음표: 사용자의 핵심 질문.

## 컬러 토큰

| 상태 | 색상 | 용도 |
|---|---:|---|
| Brand Primary | `#06111F` | 기본 워드마크/열차 |
| Brand Accent | `#1677FF` | 기본 판단 노드/레일 |
| GO | `#12B76A` | 탈 수 있음 |
| TIGHT | `#FF7A1A` | 아슬아슬 |
| NO_GO | `#F04438` | 못 탐/경고 |
| AI | `#7C3AED` | AI 분석/리포트 |
| Night | `#B6FF3B` | 야간/막차 테마 |

## 사용 규칙

기본 앱 로고는 `midnight_blue`를 사용한다. 상태를 표시해야 할 때만 accent를 바꾼다. 워드마크 전체 색을 자주 바꾸지 말고, 레일과 판단 노드만 상태 색으로 바꾸는 것이 일관적이다.

## 로딩 인터랙션

`route preview`, `decision preview`, `AI chat`, `report save`에서 공통적으로 `talsuinna_loader_v1.svg`를 사용한다.

권장 문구:

- 0–1.5초: `실시간 경로 확인 중`
- 1.5–4초: `탈 수 있는지 계산 중`
- 4초 이상: `대체 경로까지 확인 중`
- 오류/fallback: `일부 실시간 정보가 지연되어 기본 경로 기준으로 판단합니다`

## Motion

- Train pass: 1150ms, cubic-bezier(.2,.8,.2,1), infinite.
- Node pulse: 1150ms, ease-in-out, infinite.
- 성공 전환: accent를 GO로 180ms 전환.
- 아슬아슬 전환: accent를 TIGHT로 180ms 전환.
- 실패 전환: accent를 NO_GO로 180ms 전환, shake는 사용하지 않는다.

## 접근성

`prefers-reduced-motion: reduce`에서는 모든 반복 모션을 정지한다. 로딩은 텍스트 상태와 함께 제공한다. 색만으로 GO/TIGHT/NO_GO를 표현하지 말고 decision label을 같이 노출한다.
