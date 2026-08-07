# MBN Guidebook 제품·기능·데이터 인텔리전스 문서 설계 명세 v2.1

> Status: `DOCUMENT_DESIGN / PRE-IMPLEMENTATION`  
> Authority: Product SSOT Candidate  
> Scope: 제품 정의 · IA · 기능 계약 · 콘텐츠/데이터 인텔리전스 계약 · 사업 가설 · 구현 제약  
> Out of scope: 실제 React/FSD 구현, 지도 SDK 선정, 결제·파트너 계약, 운영 CMS 구축  
> Supersedes: 기존 4탭 GNB 및 shell-first 마이그레이션 서술  
> Last updated: 2026-08-07

---

## 0. Executive decision

### 0.1 제품 한 문장

**MBN Guidebook은 사용자가 현재 위치 또는 방문 예정 지역을 기준으로 한국의 문화·장소·콘텐츠를 발견하고, 관련 기사·영상·커뮤니티를 통해 맥락을 이해한 뒤, 라이브·상품·예약 등 다음 행동으로 연결되는 위치 기반 컬처커머스 플랫폼이다.**

### 0.2 이번 버전의 제품 경계

제품의 Primary Surface는 세 개로 한정한다.

```text
[ GUIDE ]      문화 발견
      ↓
[ DISCOVER ]   기사 · 영상 · 커뮤니티를 통한 맥락과 신뢰
      ↓
[ LIVE ]       라이브 · Offer · 파트너 행동 전환
```

`Saved`, `Search`, `Language`, `Profile`, `Settings`, `Notice`는 콘텐츠 목적지가 아닌 Utility Layer다. 이들은 1차 GNB를 점유하지 않는다.

### 0.3 v2에서 확정하는 구조 변경

| 항목 | 이전 가정 | v2 결정 | 이유 |
|---|---|---|---|
| Primary navigation | 지도 / 매거진 / 라이브 / 설정 | GUIDE / DISCOVER / LIVE | 설정은 반복 방문할 콘텐츠 목적지가 아님 |
| Magazine / Community | 별도 대형 탭 가능 | DISCOVER 안의 view 전환 | 맥락과 신뢰는 하나의 발견 흐름 |
| MBN IP | 제품 핵심 도메인으로 오인 가능 | provenance·content 공급·신뢰 layer | Culture-first 제품 구조 유지 |
| 트로트 | 제품 중심 카테고리 가능 | Music 하위 tag | 특정 장르로 IA·도메인 고정 방지 |
| 구현 시작점 | shell/FSD import 우선 | Product → IA → Feature → Data → Architecture | 문서가 코드 구조의 권위가 됨 |

### 0.4 v2.1의 데이터 제품 결정

프론트가 소비하는 `Place`, `StoryBundle`, `Recommendation`은 수동 fixture만으로 끝나는 1차 객체가 아니다. 이 프로젝트의 데이터 생성 경로는 아래와 같이 1급 계약으로 관리한다.

```text
MBN raw content
  ↓
Article index / article body corpus
  ↓
Taxonomy / place mention / geocoding
  ↓
Embedding / semantic relation / classification
  ↓
Recommendation candidate and ranking
  ↓
Versioned frontend release
  ↓
GUIDE / DISCOVER / LIVE
```

FRONT는 "가장 최신 PY 파일"을 암묵적으로 읽지 않는다. 검증된 `releaseId`와 manifest에 의해 식별된 projection만 소비한다.

---

## 1. Product constitution

### 1.1 해결하려는 문제

| Problem ID | 문제 | 현재 사용자 마찰 | 제품 대응 |
|---|---|---|---|
| P1: Discovery fragmentation | 장소·문화 정보가 지도, SNS, 블로그, 기사, 영상에 분산 | 여러 앱을 오가며 지역 경험을 조합해야 함 | Guide Map과 cross-link |
| P2: Context deficit | 장소 목록에 문화적 이유와 적합한 사용자가 없음 | "왜 여기여야 하지?"에 답하기 어려움 | `whyItMatters`, Story, CultureBrief |
| P3: Discovery-commerce disconnect | 콘텐츠 소비와 예약·구매·체험이 분리 | 관심이 생겨도 다음 행동이 불명확 | Offer와 partner CTA |

### 1.2 제품 가설

```text
Geo discovery
  + Editorial context
  + Social trust
  + Live commerce
  = Culture discovery-to-action funnel
```

이 가설은 사실이 아니다. 각 단계의 engagement와 outbound 행동으로 검증할 사업·제품 가설이다.

### 1.3 핵심 가치

| Value | 사용자 질문 | 책임 surface | 핵심 객체 |
|---|---|---|---|
| Where | 지금 내 주변에서 무엇을 할 수 있지? | GUIDE | Place, MapMarker |
| Why | 왜 이 장소와 콘텐츠가 중요한가? | DISCOVER / Place detail | CultureBrief, StoryBundle |
| Others | 실제 다른 사람은 어떻게 경험했나? | DISCOVER | CommunityThread |
| Now | 지금 어떤 행동을 할 수 있나? | LIVE / Place detail | Offer, Partner CTA |

### 1.4 변하지 않는 제품 원칙

1. 모든 Place에는 좌표보다 먼저 `whyItMatters`가 있다.
2. 설명과 신뢰가 CTA보다 앞선다. CTA는 거래 완료를 가장하지 않는다.
3. MBN은 콘텐츠 provenance와 신뢰 자산이지 제품의 유일한 주제가 아니다.
4. 외국인 친화성은 기본값이다. 언어·맥락·이동·식이·접근성 정보를 고려한다.
5. Community는 운영 준비도에 따라 단계적으로 공개한다.
6. live가 아니면 live처럼 보이게 하지 않는다. replay/upcoming/unavailable을 구분한다.
7. 미확정 파트너·재고·할인·결제는 UI에서 확정 사실처럼 표현하지 않는다.

---

## 2. Target and JTBD

### 2.1 Primary: Visitor

```text
한국을 방문한 외국인
국내 다른 지역에 여행·출장 온 한국인
```

> 낯선 지역에서 지금 즐길 수 있는 문화 경험을 빠르게 찾고 싶다.

### 2.2 Secondary: Local explorer

```text
주말 문화생활을 찾는 지역 거주자
근처 전시·공연·맛집·팝업을 새롭게 발견하려는 사용자
```

> 내 주변에서 평소 몰랐던 경험을 발견하고 싶다.

### 2.3 Expansion: Culture / fandom user

```text
K-pop, 트로트, 푸드, 뷰티, 패션, 공연, 방송 콘텐츠에 관심이 있는 사용자
```

> 내가 좋아하는 콘텐츠와 연결된 장소·라이브·상품을 한곳에서 보고 싶다.

### 2.4 Persona에 대한 제약

- 모든 사용자를 외국인으로 단일화하지 않는다.
- visitor mode는 profile의 입력값이지 서로 다른 앱의 분기 조건이 아니다.
- 특정 팬덤·프로그램·장르는 tag와 content relation으로 확장한다.

---

## 3. Funnel and cross-surface flow

### 3.1 공통 퍼널

```text
DISCOVER → CONTEXT → TRUST → INTENT → ACTION
```

| 단계 | 사용자 질문 | 대표 기능 | 성공 신호 |
|---|---|---|---|
| Discover | 여기 무엇이 있지? | Guide map, filters, discovery tray | Place open |
| Context | 왜 가야 하지? | Why it matters, article, video, brief | Context consumption |
| Trust | 실제로 괜찮나? | Curated community, provenance | Community open |
| Intent | 해볼까? | Save, course, live entry | Save / live open |
| Action | 지금 무엇을 할 수 있나? | Offer, partner CTA | Outbound CTA click |

모든 기능 명세에는 이 중 최소 하나의 funnel stage를 명시한다. 어느 단계에도 기여하지 않는 기능은 MVP에 넣지 않는다.

### 3.2 대표 사용자 흐름

```text
GUIDE
  → Place preview
  → Place detail
  → Why / story / community
  → Save 또는 Offer

DISCOVER
  → Story bundle
  → Linked place
  → Guide 또는 Place detail
  → Save / live / offer

LIVE
  → Session detail
  → Related culture and place
  → Offer disclosure
  → Partner CTA
```

### 3.3 금지되는 흐름

- Offer를 Guide의 첫 진입 화면에서 콘텐츠보다 먼저 강제 노출하지 않는다.
- Story에서 관련 Place 없이 partner CTA만 연결하지 않는다.
- Community가 준비되지 않은 상태에서 글쓰기·실시간 반응을 활성화된 것처럼 표시하지 않는다.
- 라이브 세션이 없는 상태에서 fake viewer, fake chat, fake stock을 만들지 않는다.

---

## 4. Information architecture and routing

### 4.1 Primary navigation

```text
┌─────────────────────────────────────┐
│ Logo / Search        Saved / Profile │
│                                     │
│            Page content             │
│                                     │
├─────────────────────────────────────┤
│           GUIDE  DISCOVER  LIVE     │
└─────────────────────────────────────┘
```

| Surface | 목적 | 주요 entry | Utility 연결 |
|---|---|---|---|
| GUIDE | 위치·지역·시간 기반 문화 발견 | current location, city, search | filter, saved, search |
| DISCOVER | 콘텐츠 기반 맥락과 신뢰 형성 | hero story, theme, linked place | magazine/community toggle, saved |
| LIVE | 설명 후 전환을 돕는 세션·Offer | live now, upcoming, replay | saved, partner CTA |

### 4.2 Route contract

| 유형 | Route | URL 책임 | 주요 composition |
|---|---|---|---|
| Primary | `/guide` | location/filter context | map discovery workspace |
| Primary | `/discover` | `view=magazine|community`, theme/filter | magazine feed 또는 community feed |
| Primary | `/live` | session category/status | live commerce hub |
| Detail | `/place/:placeId` | `placeId` 검증·fallback | place detail sheet/page |
| Detail | `/story/:storyId` | `storyId` 검증 | story detail |
| Detail | `/live/:sessionId` | `sessionId` 검증 | live detail panel |
| Utility | `/search` | query | search results |
| Utility | `/saved` | collection/filter | saved hub |
| Utility | `/settings` | none | traveler settings |

MVP에서 community의 독립 Primary Route는 만들지 않는다. 기본은 `/discover?view=community`다.

### 4.3 Entry, exit, and back behavior

| 시작점 | 목적지 | 보존해야 하는 상태 | 뒤로가기 |
|---|---|---|---|
| Guide marker/card | Place detail | city, category, map viewport, selected source | 이전 Guide 상태 복원 |
| Discover story | Place detail | story ID, discover view/theme | story로 복귀 |
| Live card | Live detail | status filter, carousel position | Live hub로 복귀 |
| Related place | Guide 또는 place | originating object ID | 출발 콘텐츠를 history state로 보존 |
| Saved item | 원래 target | saved filter/collection | Saved hub로 복귀 |

---

## 5. Taxonomy, content provenance, and localization

### 5.1 Category taxonomy

Category는 GNB가 아니라 Guide/Discover/LIVE에 공통 적용하는 filter taxonomy다.

```text
전체
공연
전시
음악
푸드
뷰티·패션
방송·미디어
힐링
액티비티
```

세부 문화는 `tag`로 관리한다.

```text
trot, kpop, food, beauty, fashion, exhibition,
performance, healing, market, night, family, solo
```

### 5.2 Provenance model

MBN 여부를 `place.mbnRecommended = true` 같은 제품 결합 boolean으로 두지 않는다.

```text
provenance.source     = mbn | editor | partner | community | public
provenance.reference  = 콘텐츠 또는 추천 근거 ID
provenance.label      = 사용자에게 보이는 신뢰 라벨
content.ip            = 프로그램/시리즈/인물/캠페인 참조
content.tags          = 문화 taxonomy
```

| provenance | 사용자 노출 예 | 제품 의미 |
|---|---|---|
| `mbn` | MBN 콘텐츠 연결 | 콘텐츠 IP·신뢰 자산 |
| `editor` | 에디터 픽 | 큐레이션 근거 |
| `partner` | 제휴 정보 | 광고/제휴 disclosure 필요 |
| `community` | 커뮤니티 반응 | 사용자 경험·신선도 |
| `public` | 공공/공개 정보 | 기본 장소 정보 |

### 5.3 Locale rules

- `ko`, `en`은 MVP 필수 locale다.
- 모든 사용자 노출 content는 locale availability를 표시한다. 번역이 없으면 조용히 영어인 척하지 않는다.
- Place title, `whyItMatters`, Offer disclosure, availability, error/empty message는 locale contract의 범위다.
- user-created community content는 Phase 1에서 자동 번역을 가정하지 않는다.

---

## 6. Product surface specification

### 6.1 GUIDE — map discovery

#### 목적

위치·지역·시간을 기준으로 사용자가 문화 경험을 발견하게 한다. 지도는 종착지가 아니라 **큐레이션된 관계를 탐색하는 표면**이다.

#### 화면 구성

```text
Search
Location / city context
Category filter
Time filter
Map pins
Discovery tray
Selected place preview
```

#### Feature inventory

| ID | 기능 | Funnel | MVP | 상태 |
|---|---|---|---|---|
| G-01 | location/city context 선택 | Discover | 필수 | loading, denied, manual fallback |
| G-02 | category/time filter | Discover | 필수 | default, selected, empty |
| G-03 | map pin/list fallback | Discover | 필수 | loading, map unavailable, list fallback |
| G-04 | discovery tray | Discover | 필수 | populated, empty, retry |
| G-05 | place preview/open | Discover → Context | 필수 | active, limited, unavailable |
| G-06 | culture layer toggle | Discover | 보류 | feature-flagged |

#### Place card contract

```text
Place name
Category
Distance or area
Available time when known
Representative image
Why it matters
Source / provenance
```

`whyItMatters`가 없는 Place는 primary discovery fixture에 노출하지 않는다.

#### Acceptance criteria

- filter 선택은 map marker와 list fallback에 동일하게 반영된다.
- map SDK가 unavailable이어도 Place list로 탐색을 지속할 수 있다.
- selected Place는 source/provenance를 잃지 않고 detail로 이동한다.
- location 권한 거절은 오류가 아니라 city manual selection으로 이어진다.

### 6.2 PLACE DETAIL — context before conversion

#### 고정 정보 순서

```text
1. 장소
2. 왜 여기인가
3. 현재 가능한 문화 경험
4. 관련 MBN / Editorial 콘텐츠
5. 사용자 반응
6. 저장 / 공유
7. 구매 / 예약 / Live CTA
```

#### 섹션 계약

| 순서 | 섹션 | 최소 입력 | 비어 있을 때 |
|---:|---|---|---|
| 1 | Hero / identity | Place title, image, category, provenance | image placeholder, identity 유지 |
| 2 | Why it matters | localized reason | Place를 primary surface에서 제외 |
| 3 | Current experience | availability/status/caution | limited/unavailable 고지 |
| 4 | Related content | article/video/story bundle | "관련 콘텐츠 준비 중" |
| 5 | Community evidence | curated thread/reaction summary | curated 없음 고지, fake count 금지 |
| 6 | Intent action | save/share eligibility | disabled reason 표시 |
| 7 | Offer / CTA | Offer availability + disclosure | CTA 비활성·waitlist·saved 대안 |

Commerce CTA가 2번보다 위로 올라가는 디자인은 허용하지 않는다.

### 6.3 DISCOVER — editorial + community

#### 목적

지도에서 찾은 Place를 이해시키고, 콘텐츠에서 새로운 Place를 역으로 발견하게 한다.

#### Magazine view

```text
Hero video or editorial
Headline / deck / thumbnail
Category / published at / source
Linked places
Related live
```

한 주제의 콘텐츠 묶음은 `StoryBundle`이다.

```text
[Representative MBN or editorial video]
관련 기사 A / B
관련 Place 3곳
관련 Live
```

#### Community view maturity

| Phase | 사용자 허용 | 운영 전제 |
|---|---|---|
| 1 | read-only curated thread, place review, question, save, report UI | moderation backend 없음 |
| 2 | limited write | login, moderation queue, policy 필요 |
| 3 | public community | reporting, moderation, abuse 대응, legal policy 필요 |

#### Acceptance criteria

- Magazine과 Community는 동일한 Discover surface 안에서 toggle된다.
- Story의 linked Place는 Guide 또는 Place detail로 자연스럽게 이동한다.
- Phase 1의 report 버튼은 실제 신고 접수 여부를 오인시키지 않는다.
- community item의 freshness/provenance/moderation state가 화면 상태로 표현된다.

### 6.4 LIVE — context-assisted action

#### 정의

Live는 기존 방송 위에 구매 버튼을 덧씌우는 구조가 아니다. Host, culture context, related place, Offer를 관계로 묶는 독립 제품 객체다.

```text
Host → LiveSession → Culture context → Related place → Offer → Partner CTA
```

#### 상태

| Status | 의미 | 반드시 보여 줄 UI | 금지 |
|---|---|---|---|
| `live` | 실제 진행 중 | live indicator, start context, availability | fake count |
| `upcoming` | 예정 세션 | scheduled time, reminder eligibility | 지금 보기 CTA |
| `replay` | 다시보기 | replay label, duration, recorded context | live wording |
| `unavailable` | 접근 불가/종료 | reason, related content, back action | broken player |

#### Detail order

```text
Player
Host / title / status
Chat or reaction state
Culture context card
Related place
Offer card
Disclosure + partner CTA
```

실시간 chat가 없으면 replay/upcoming 상태에 맞는 반응·콘텐츠 모듈로 대체하고, 채팅 UI를 비활성화된 실제 기능처럼 꾸미지 않는다.

---

## 7. Feature contract register

모든 MVP feature는 `Purpose → Actor → Trigger → Precondition → Input → Processing → Output → UI states → Analytics → Acceptance`으로 기술한다. 아래는 ID와 책임의 기준표다.

| ID | Feature | Actor | Trigger | 핵심 precondition | Output |
|---|---|---|---|---|---|
| P-01 | complete onboarding | visitor | first entry | anonymous profile exists | profile completed |
| P-02 | select language | all | language control | supported locale | locale switch |
| G-01 | select location | visitor | guide entry | manual fallback available | location context |
| G-02 | filter places | all | filter interaction | taxonomy loaded | filtered place set |
| G-03 | select place | all | pin/card/link | target place resolves | place detail navigation |
| D-01 | toggle discover view | all | Magazine/Community control | requested view enabled | query/view state |
| D-02 | open story bundle | all | story card | story resolves | story detail navigation |
| D-03 | open community evidence | all | thread/reaction | state is readable | discover community context |
| L-01 | open live session | all | live card | session resolves | live detail navigation |
| L-02 | open culture brief | all | context prompt | service/fixture enabled | CultureBrief state |
| I-01 | save item | all | save control | target is saveable | SavedItem mutation |
| I-02 | share item | all | share control | supported channel/fallback | share attempt result |
| A-01 | open partner CTA | all | offer CTA | availability + disclosure | outbound attempt |
| U-01 | manage profile | all | settings | profile store available | persisted profile |

### 7.1 공통 UI 상태

| 상태 | 필수 질문 | 표시 원칙 |
|---|---|---|
| loading | 무엇을 기다리는가? | 실제 레이아웃을 반영한 skeleton |
| empty | 데이터가 왜 없는가? | 원인 + 다음 탐색 행동 |
| error | 재시도 가능한가? | 실패 범위와 retry/action |
| denied | 권한이 왜 필요한가? | 대안 경로 제공 |
| unavailable | 지금 왜 행동할 수 없는가? | offer/session 이유와 대체 행동 |
| disabled | 어떤 조건이 부족한가? | tooltip 또는 보조 설명 |

---

## 8. Content and data contract

### 8.1 핵심 관계

```text
Place ── has ──> CultureBrief
  │                  │
  ├── links ──> StoryBundle / Article / LiveSession / CommunityThread
  │                                               │
  └── offers ───────────────────────────────────> Offer

TravelerProfile ── saves ──> SavedItem ── targets ──> Place | Story | LiveSession
```

### 8.2 Core entity contract

```ts
type PlaceId = string
type LocaleCode = "ko" | "en"

type PlaceCategory =
  | "performance"
  | "exhibition"
  | "music"
  | "food"
  | "beauty-fashion"
  | "broadcast-media"
  | "healing"
  | "activity"

type Provenance = {
  source: "mbn" | "editor" | "partner" | "community" | "public"
  referenceId?: string
  label: string
  sponsored?: boolean
}

type LocalizedPlaceContent = {
  title: string
  subtitle?: string
  whyItMatters: string
  shortDescription: string
  culturalContext?: string
  accessGuide?: string
}

type Place = {
  id: PlaceId
  slug: string
  category: PlaceCategory
  tags: string[]
  coordinates: { lat: number; lng: number }
  localeContent: Record<LocaleCode, LocalizedPlaceContent>
  heroImageUrl?: string
  provenance: Provenance[]
  accessibility: {
    mobility?: "easy" | "partial" | "limited"
    familyFriendly?: boolean
    foreignerFriendly?: boolean
    dietarySupport?: string[]
  }
  linkedStoryIds: string[]
  linkedLiveSessionIds: string[]
  linkedCommunityThreadIds: string[]
  offerIds: string[]
  status: "active" | "limited" | "unavailable"
}

type CultureBrief = {
  id: string
  placeId: PlaceId
  locale: LocaleCode
  summary: string
  whyNow?: string
  idealFor: string[]
  cautionNotes?: string[]
  sectionOrder: ("context" | "story" | "community" | "offer")[]
  status: "ready" | "partial" | "error"
}

type StoryBundle = {
  id: string
  localeContent: Record<LocaleCode, {
    headline: string
    deck: string
    summary: string
  }>
  heroMedia?: { type: "video" | "image"; url: string }
  articleIds: string[]
  linkedPlaceIds: PlaceId[]
  linkedLiveSessionIds: string[]
  tags: string[]
  provenance: Provenance[]
  publishedAt?: string
}

type Offer = {
  id: string
  offerType: "product" | "ticket" | "reservation" | "experience" | "external-link"
  title: string
  partner: string
  availability: "active" | "coming-soon" | "unavailable"
  priceDisplay?: string
  disclosure: string
  linkedPlaceId?: PlaceId
  linkedLiveId?: string
  outboundUrl?: string
}

type LiveSession = {
  id: string
  slug: string
  status: "live" | "upcoming" | "replay" | "unavailable"
  localeContent: Record<LocaleCode, { title: string; deck: string; summary: string }>
  hostName: string
  scheduledAt?: string
  replayUrl?: string
  linkedPlaceIds: PlaceId[]
  linkedOfferIds: string[]
  provenance: Provenance[]
}

type TravelerProfile = {
  locale: LocaleCode
  visitorMode: "foreigner" | "domestic-traveler" | "local-explorer"
  interests: PlaceCategory[]
  budget: "light" | "balanced" | "premium"
  mobility: "walk" | "transit" | "taxi"
  dietaryNeeds: string[]
  hasCompletedOnboarding: boolean
}
```

### 8.3 Contract invariants

- `Place.localeContent[*].whyItMatters`는 primary discovery 대상에서 필수다.
- `Offer`는 `availability`와 `disclosure`가 없으면 CTA 노출 대상이 아니다.
- sponsored/partner provenance는 콘텐츠 provenance와 구분해 시각적으로 고지한다.
- domain model은 지도 SDK, live player, CMS, LLM, partner DTO 타입을 직접 포함하지 않는다.
- `SavedItem`은 target의 전체 snapshot이 아닌 `targetType`, `targetId`, `savedAt`, collection metadata만 저장한다.
- CommunityThread는 moderation state와 source를 가진다. MVP read-only는 명시적 상태다.

### 8.4 Article and corpus contract

`Article`은 StoryBundle의 부속 metadata가 아니라 데이터 파이프라인의 출발점인 Core Entity다. 수집 단계의 제목·URL·수집 provenance와 본문 corpus를 분리해 보존한다. 이 분리는 제목의 `[단독]`, `[인터뷰]` 같은 bracket metadata를 보존하면서도 본문 NLP 처리·재처리를 독립시킨다.

```ts
type ArticleIndex = {
  articleId: string
  sourceArticleId: string
  url: string
  rawTitle: string
  cleanTitle: string
  bracketTokens: string[]
  section?: string
  publishedAt?: string
  thumbnailUrl?: string
  author?: string
  collectedAt: string
  rawSha256: string
}

type ArticleBody = {
  articleId: string
  rawBody: string
  cleanBody: string
  language: LocaleCode | "other" | "unknown"
  paragraphCount: number
  parserVersion: string
  parseStatus: "PARSED" | "EMPTY" | "PARTIAL" | "FAILED"
  bodySha256: string
}

type Article = {
  index: ArticleIndex
  body?: ArticleBody
  taxonomyIds: string[]
  linkedPlaceIds: PlaceId[]
  provenance: Provenance[]
}
```

| 계약 | 규칙 |
|---|---|
| Stable identity | `articleId`는 release 간 stable internal ID이고, `sourceArticleId`는 source가 제공하는 식별자다. 둘을 혼동하지 않는다. |
| Raw retention | `rawTitle`, `bracketTokens`, `rawBody`는 파생 처리로 덮어쓰지 않는다. |
| Clean derivation | `cleanTitle`, `cleanBody`는 parser/model version이 있는 파생 결과다. |
| Parse failure | 본문 수집/파싱 실패는 `null`로 묵살하지 않고 `parseStatus`로 남긴다. |
| Provenance | URL, 수집 시각, SHA-256, parser version을 release까지 추적한다. |
| Front projection | FRONT는 필요 최소 metadata와 승인된 요약만 받는다. corpus 원문 전체를 기본 bundle에 포함하지 않는다. |

#### Title structure extraction

`bracketTokens`는 단순 display decoration이 아니다. 예를 들어 `[단독]`, `[인터뷰]`, `[현장]`는 기사 유형, trust signal, editorial ranking feature 후보가 될 수 있다. 원문 title을 보존하고 extraction rule/version을 따로 기록한다.

```text
rawTitle
  ↓ title parser (versioned)
cleanTitle + bracketTokens[] + titleParseStatus
```

### 8.5 Place resolution and geocoding contract

완성형 `Place`는 corpus에서 바로 생성되지 않는다. article text의 언급, 후보 정규화, geocoding, canonicalization을 분리한 상태 머신을 거친다.

```text
Article
  ↓
PlaceMention
  ↓
PlaceCandidate
  ↓
GeocodeCandidate
  ↓
CanonicalPlace
  ↓
Place projection
```

```ts
type PlaceMention = {
  mentionId: string
  articleId: string
  surface: string
  normalizedSurface: string
  contextText: string
  paragraphIndex?: number
  extractionMethod: "rule" | "ner" | "hybrid"
  extractionVersion: string
  confidence: number
}

type PlaceCandidate = {
  candidateId: string
  mentionIds: string[]
  candidateName: string
  categoryHint?: PlaceCategory
  regionHint?: string
  candidateStatus: "PENDING" | "MERGED" | "REJECTED"
}

type GeocodeResult = {
  geocodeResultId: string
  candidateId: string
  provider: string
  providerPlaceId?: string
  formattedAddress?: string
  coordinates?: { lat: number; lng: number }
  geocodeStatus: "RESOLVED" | "AMBIGUOUS" | "NOT_FOUND" | "ERROR"
  providerConfidence?: number
  queriedAt: string
}

type CanonicalPlace = {
  canonicalPlaceId: string
  canonicalName: string
  sourceCandidateIds: string[]
  selectedGeocodeResultId?: string
  canonicalStatus: "ACTIVE" | "REVIEW_REQUIRED" | "RETIRED"
}
```

| 상태 | 의미 | FRONT projection 규칙 |
|---|---|---|
| `RESOLVED` | 유효 좌표와 단일 canonical 대상 확보 | map 가능한 Place 후보 |
| `AMBIGUOUS` | 후보가 둘 이상이거나 근거 부족 | 자동 pin 생성 금지, review queue |
| `NOT_FOUND` | geocoder가 해석하지 못함 | 좌표 없는 article relation으로만 보존 가능 |
| `ERROR` | provider/transport/validation 오류 | 재시도·감사 대상, NOT_FOUND로 합치지 않음 |

`Place.coordinates`는 모든 source candidate의 필수가 아니다. FRONT에 map pin으로 projection되는 active Place만 유효 좌표를 요구한다. geocoding 실패를 삭제하거나 임의 좌표로 채우지 않는다.

### 8.6 Embedding and semantic relation contract

semantic relation은 UX의 "관련 콘텐츠"와 추천 candidate retrieval을 위해 존재한다. embedding vector 자체는 release projection의 기본 payload가 아니며, model/version/차원과 원본 relation을 추적하는 데이터 계약이다.

```ts
type EmbeddingRecord = {
  embeddingId: string
  objectType: "article" | "place" | "story-bundle" | "live-session"
  objectId: string
  modelId: string
  modelRevision?: string
  dimension: number
  inputHash: string
  generatedAt: string
  generationStatus: "READY" | "FAILED" | "STALE"
}

type SemanticRelation = {
  relationId: string
  sourceType: string
  sourceId: string
  targetType: string
  targetId: string
  similarityScore: number
  retrievalRank: number
  modelId: string
  modelRevision?: string
  generatedAt: string
}
```

| 검증 | 최소 조건 |
|---|---|
| Model traceability | modelId, revision, dimension, inputHash가 기록됨 |
| Vector compatibility | 같은 index/search space의 dimension과 model family가 일치 |
| Retrieval evidence | top-k relation은 score와 rank를 보존 |
| Staleness | article body/taxonomy 변경 뒤 embedding이 stale인지 판정 가능 |
| Projection safety | vector raw value와 provider credential은 FRONT release에 넣지 않음 |

### 8.7 Recommendation contract

추천은 하나의 black-box score가 아니라 `candidate retrieval → ranking`의 두 단계 계약이다. 후보 생성과 순위 부여를 분리해야 동일한 candidate set에서 ranking version을 바꾸거나, ranking 설명을 감사할 수 있다.

```text
Context → Candidate retrieval → Eligibility filter → Ranking → Recommendation projection
```

```ts
type Recommendation = {
  recommendationId: string
  contextType: "guide" | "place" | "story" | "live" | "profile"
  contextId: string
  targetType: "place" | "story-bundle" | "live-session" | "offer"
  targetId: string
  semanticScore?: number
  geoScore?: number
  taxonomyScore?: number
  temporalScore?: number
  finalScore: number
  reasons: RecommendationReason[]
  modelVersion: string
  rankingVersion: string
  generatedAt: string
}

type RecommendationReason = {
  code: "NEARBY" | "INTEREST_MATCH" | "ARTICLE_RELATED" | "SAME_AREA" | "MBN_CONNECTED" | "LIVE_NOW"
  localeContent: Record<LocaleCode, string>
  evidence?: { distanceMeters?: number; sourceArticleId?: string; taxonomyId?: string }
}
```

FRONT에 전달 가능한 이유의 예시는 다음과 같다.

```text
현재 위치에서 850m
푸드 관심사와 일치
방금 본 기사와 관련
같은 지역의 전시
MBN 기사와 연결된 장소
```

| Ranking rule | 계약 |
|---|---|
| Candidate retrieval | semantic, geo, taxonomy 등의 candidate source와 retrieval version을 기록 |
| Eligibility | unavailable, broken FK, locale 불가, geocode 불가 target을 ranking 전 제외 |
| Score decomposition | finalScore만 제공하지 않고 기여 score를 optional trace로 보존 |
| Reason requirement | 노출 recommendation은 사람이 읽을 수 있는 최소 한 개 reason을 가져야 함 |
| Versioning | model/ranking/taxonomy release 변경을 각각 독립 추적 |
| Fairness/safety | sponsored target은 organic ranking과 명시적으로 구분하고 provenance를 숨기지 않음 |

### 8.8 Frontend release contract

PY 산출물은 working directory의 "최신 파일"이 아니라 immutable `releaseId`로 배포한다. FRONT는 manifest가 승인한 release projection만 소비하며, release가 바뀌면 data refresh와 UI 검증도 같은 단위로 수행한다.

```text
data/90_exports/frontend/
└─ <releaseId>/
   ├─ manifest.json
   ├─ places.json
   ├─ articles.json
   ├─ stories.json
   ├─ recommendations.json
   ├─ taxonomy.json
   └─ quality_report.json
```

```ts
type FrontendReleaseManifest = {
  releaseId: string
  sourceBranch: string
  sourceCommit: string
  contractVersion: string
  schemaVersion: string
  taxonomyVersion: string
  pipelineVersion: string
  embeddingModel?: string
  generatedAt: string
  recordCounts: Record<string, number>
  qualityStatus: "PASS" | "PASS_WITH_WARNINGS" | "FAIL"
  files: Array<{ path: string; sha256: string; bytes: number }>
}

type FrontendReleaseQualityReport = {
  releaseId: string
  contractVersion: string
  validationStatus: "PASS" | "PASS_WITH_WARNINGS" | "FAIL"
  articleParse: Record<"PARSED" | "EMPTY" | "PARTIAL" | "FAILED", number>
  geocode: Record<"RESOLVED" | "AMBIGUOUS" | "NOT_FOUND" | "ERROR", number>
  embeddings: { ready: number; failed: number; stale: number }
  recommendations: { generated: number; missingReason: number; brokenForeignKey: number }
  projection: { localeGaps: number; missingWhyItMatters: number; unavailableOffers: number }
  checks: Array<{ id: string; status: "PASS" | "WARN" | "FAIL"; detail: string }>
}
```

| Release rule | 필수 검증 |
|---|---|
| Immutable identity | releaseId, source branch/commit, pipeline/contract/schema version이 존재 |
| Bundle integrity | manifest의 모든 projection file SHA-256과 byte count가 일치 |
| Schema | file별 schema validation, locale/provenance 필수 필드, enum 검증 |
| Referential integrity | article/story/place/live/offer/recommendation의 FK 누락 0 |
| Data quality | geocode, parse, embedding, recommendation 상태 분포를 quality report로 공개 |
| Consumption | FRONT configuration은 releaseId를 명시하며 unpinned directory를 읽지 않음 |
| Failure | `qualityStatus=FAIL` release는 preview/production promotion 불가 |

### 8.9 Generation provenance for CultureBrief and StoryBundle

`CultureBrief`, `StoryBundle`, 특히 `whyItMatters`는 에디터·규칙·retrieval·LLM이 섞일 수 있다. 생성 주체를 모호하게 두지 않고 source와 confidence를 객체에 연결한다.

```ts
type GenerationMethod = "editorial" | "rule" | "retrieval" | "llm" | "hybrid"

type GenerationProvenance = {
  generationMethod: GenerationMethod
  sourceArticleIds: string[]
  modelId?: string
  promptVersion?: string
  generatedAt?: string
  reviewerStatus?: "NOT_REQUIRED" | "PENDING" | "APPROVED" | "REJECTED"
}

type ExplainableText = {
  text: string
  source: GenerationProvenance
  confidence?: number
}
```

- AI가 `whyItMatters`를 생성하면 text, source article IDs, generation method, model/prompt version, confidence를 함께 남긴다.
- `confidence`는 사실성 보증이 아니며 review 필요성 판단용 signal이다.
- sourceArticleIds가 없거나 review 정책을 만족하지 못한 LLM text는 production Place projection으로 promote하지 않는다.
- editorial copy도 `generationMethod=editorial`로 provenance를 남겨 AI 생성물과 같은 감사 경로를 가진다.

---

## 9. Business and monetization hypothesis

사업 계약이 확정되기 전의 수익 모델은 모두 hypothesis다. PRD, UI, analytics에서 확정 수익처럼 표현하지 않는다.

| ID | Hypothesis | 가능한 메커니즘 | UI/운영 제약 |
|---|---|---|---|
| BM-H1 | Live commerce fee | partner sale → commission | 실제 정산·주문 상태를 FE가 판단하지 않음 |
| BM-H2 | Sponsored discovery | guide/discover의 paid exposure | `Sponsored`/`광고`/`제휴`를 명확히 표기 |
| BM-H3 | Branded live/content | brand × MBN IP × creator | editorial과 광고의 provenance 분리 |
| BM-H4 | Outbound lead | reservation/ticket/product partner lead | CTA click만 프론트의 검증 이벤트 |

### 9.1 Offer 정책

- 할인, 재고, 쿠폰, 예약 확정은 partner contract가 있기 전까지 fixture의 가정일 뿐이다.
- `priceDisplay`는 표시 가능한 계약 정보가 있을 때만 사용한다.
- `outboundUrl`이 없으면 active CTA를 만들지 않는다.
- Offer의 availability와 disclosure는 card·detail·live 모두에서 일관되게 보인다.

---

## 10. Technology architecture constraints

이 절은 제품·IA·feature·data가 확정된 뒤에만 FSD와 adapter 경계를 정의한다. 아키텍처가 제품 명사를 선행 결정하지 않는다.

### 10.1 FSD global structure

```text
src/
├─ app/
│  ├─ providers/
│  ├─ router/
│  ├─ layouts/
│  ├─ guards/
│  └─ model/
├─ pages/
│  ├─ guide-page/
│  ├─ place-page/
│  ├─ discover-page/
│  ├─ story-page/
│  ├─ live-page/
│  ├─ live-detail-page/
│  ├─ search-page/
│  ├─ saved-page/
│  └─ settings-page/
├─ widgets/
│  ├─ app-chrome/
│  ├─ bottom-navigation/
│  ├─ map-discovery-workspace/
│  ├─ place-detail-sheet/
│  ├─ magazine-feed/
│  ├─ story-detail/
│  ├─ community-feed/
│  ├─ live-commerce-hub/
│  ├─ live-detail-panel/
│  ├─ saved-hub/
│  ├─ traveler-settings-form/
│  └─ culture-brief-panel/
├─ features/
│  ├─ complete-onboarding/
│  ├─ select-language/
│  ├─ manage-traveler-profile/
│  ├─ filter-places/
│  ├─ select-place/
│  ├─ toggle-discover-view/
│  ├─ save-item/
│  ├─ share-item/
│  ├─ open-partner-cta/
│  ├─ send-culture-brief/
│  └─ navigate-entrypoint/
├─ entities/
│  ├─ place/
│  ├─ culture-brief/
│  ├─ story-bundle/
│  ├─ article/
│  ├─ live-session/
│  ├─ offer/
│  ├─ traveler-profile/
│  ├─ saved-item/
│  ├─ community-thread/
│  └─ chat-message/
└─ shared/
   ├─ api/
   ├─ analytics/
   ├─ config/
   ├─ i18n/
   ├─ lib/
   ├─ map/
   ├─ model/
   ├─ styles/
   ├─ ui/
   └─ types/
```

### 10.2 Layer responsibility

| Layer | 허용 | 금지 |
|---|---|---|
| app | router, provider, theme/i18n bootstrap, feature flag, onboarding guard, shell | Place fixture, raw API, place card JSX |
| pages | route param, redirect, loading boundary, widget composition | storage, endpoint, business logic, long styles |
| widgets | entity/feature composition, section layout, view model consume | raw DTO, global fixture, partner URL construction |
| features | action orchestration, adapter call, analytics, eligibility check | feature-to-feature internals, page composition, app shell |
| entities | schema, DTO mapper, selector, repository contract, fixture | router, GNB state, CTA orchestration, page layout |
| shared | primitive UI, safe storage, HTTP, analytics client, i18n core, map base | Product domain noun, product tab, business rule |

### 10.3 Adapter rules

| External dependency | Contract owner | Adapter boundary | implementation decision |
|---|---|---|---|
| Place/content API | entity | repository interface, mapper | mock / HTTP / CMS |
| Map SDK | shared | `MapAdapter`, `MapMarker` | mock / Mapbox / Google / other |
| Live provider | entity/feature | session/player adapter | TBD |
| Culture brief | feature | `CultureBriefService` | fixture / editor / AI |
| Partner CTA | feature | `PartnerCtaAdapter` | outbound/deep link |
| Persistence | shared + entity store | safe storage adapter | local / account sync |

```ts
interface PlaceRepository {
  list(params: PlaceListParams): Promise<Place[]>
  getById(id: PlaceId): Promise<Place | null>
  getNearby(params: NearbyPlaceParams): Promise<Place[]>
}

interface MapAdapter {
  render(container: HTMLElement, options: MapRenderOptions): MapInstance
  addMarkers(markers: MapMarker[]): void
  fitBounds(bounds: MapBounds): void
  destroy(): void
}

interface PartnerCtaAdapter {
  canOpen(offer: Offer): boolean
  open(offer: Offer, context: PartnerCtaContext): Promise<PartnerCtaResult>
}
```

### 10.4 Non-negotiable architecture rules

- page에서 API 또는 storage를 직접 호출하지 않는다.
- widget은 raw endpoint, raw DTO, fixture, partner URL을 소유하지 않는다.
- feature가 route object를 직접 조립하지 않는다. navigation contract를 사용한다.
- shared에 Place, Offer, LiveSession 같은 제품 명사를 두지 않는다.
- mock/live/provider 구현을 한 파일에 섞지 않는다.
- map SDK 전용 타입을 Place domain model에 넣지 않는다.
- entity가 UI open/close state와 sheet visibility를 소유하지 않는다.
- CTA는 availability와 disclosure가 둘 다 없으면 활성화하지 않는다.

### 10.5 PY / Notebook architecture constraints

DATA/ML track은 FRONT의 하위 전처리 스크립트가 아니다. source acquisition, corpus, geo, semantic, ranking, release validation을 책임지는 독립 pipeline이며, FRONT에는 검증된 projection만 전달한다.

```text
DOCS contract
   ↓
PY notebook pipeline
   ↓
versioned frontend release
   ↓
FRONT repository adapter
```

#### Pipeline milestone and notebook matrix

| Data milestone | Notebook | 입력 | 산출물 | 다음 단계 gate |
|---|---|---|---|---|
| M0 Contract bootstrap | `00BootstrapAndContracts.ipynb` | docs schema/decision log | pinned contract/taxonomy/version | contract validation |
| M1 MBN index mining | `01CollectMBNIndex.ipynb` | approved source policy | ArticleIndex raw intake | stable sourceArticleId |
| M2 Title structure | `02ExtractTitleStructure.ipynb` | ArticleIndex | clean title, bracket tokens | parser audit |
| M3 Article body corpus | `03CollectArticleBody.ipynb` | approved index scope | ArticleBody raw/parse state | source/body SHA |
| M4 Corpus normalization | `04NormalizeCorpus.ipynb` | ArticleBody | clean body, language, paragraph count | parse quality |
| M5 Culture taxonomy | `05BuildCultureTaxonomy.ipynb` | corpus + editorial rules | taxonomy projection | versioned taxonomy |
| M6 Place candidate extraction | `06ExtractPlaceCandidates.ipynb` | normalized corpus | PlaceMention/Candidate | extraction evidence |
| M7 Geocoding | `07ResolvePlaceGeocodes.ipynb` | PlaceCandidate | GeocodeResult/CanonicalPlace | resolved/ambiguous split |
| M8 Embedding | `08GenerateEmbeddings.ipynb` | approved corpus objects | EmbeddingRecord | model/dimension trace |
| M9 Semantic retrieval | `09BuildSemanticRelations.ipynb` | embedding index | SemanticRelation top-k | relation validation |
| M10 Classification | `10ClassifyCultureContent.ipynb` | corpus/relations | taxonomy labels | taxonomy QA |
| M11 Recommendation candidate | `11GenerateRecommendationCandidates.ipynb` | geo/semantic/taxonomy | eligible candidates | no broken target |
| M12 Ranking | `12RankRecommendations.ipynb` | candidates/context rules | Recommendation | reason/score decomposition |
| M13 Frontend release | `13BuildFrontendRelease.ipynb` | approved projections | release bundle + manifest | SHA/schema/FK checks |
| M14 Release validation | `14ValidateFrontendRelease.ipynb` | release bundle | quality report + promotion verdict | PASS only promotion |

#### Pipeline operating rules

- M1/M3의 source acquisition은 별도 source-policy, robots/terms, rate, scope, retention 결정 없이는 실행 권한이 아니다.
- raw data, normalized corpus, feature/vector index, frontend projection은 물리적으로 구분한다. FRONT release에는 필요한 projection만 포함한다.
- 각 notebook은 input release/contract version, output path, record count, exception count를 기록한다.
- notebook PASS는 다음 milestone의 자동 promotion이 아니다. 해당 gate의 validation artifact가 있어야 한다.
- `AMBIGUOUS`, `NOT_FOUND`, `ERROR`, `FAILED`, `STALE` 상태를 정상 record로 보존한다. 성공 record만 남겨 quality를 과장하지 않는다.
- model, parser, taxonomy, ranking이 변경되면 기존 release를 덮어쓰지 않고 새 releaseId를 생성한다.

#### Recommended data zone separation

```text
data/
├─ 00_contracts/             # schema, taxonomy, decision-pinned versions
├─ 10_raw/                   # source intake; frontend 비노출
├─ 20_corpus/                # article index/body and normalized corpus
├─ 30_geo/                   # mention/candidate/geocode/canonical resolution
├─ 40_semantic/              # embedding metadata and relations
├─ 50_recommendation/        # candidate/ranking/reason projections
├─ 80_quality/               # validation reports and gate evidence
└─ 90_exports/frontend/      # immutable release bundles only
```

이 경로는 논리적 소유권을 표현한다. 실제 repository·storage 분리는 source policy, 보안, 배포 구조가 확정될 때 결정한다.

---

## 11. Analytics and success measurement

### 11.1 Funnel event contract

```text
Guide impression
  → Place open
  → Context consumption
  → Save / Live open
  → Offer open
  → Partner CTA
```

| Event | 발생 시점 | 최소 payload |
|---|---|---|
| `guide_viewed` | Guide surface 노출 | city, locale, visitorMode |
| `map_pin_opened` | marker/card 선택 | placeId, category, provenance |
| `place_detail_viewed` | Place detail 진입 | placeId, entryPoint |
| `context_consumed` | why/story/video section 열람 | placeId, contextType |
| `story_opened` | Story detail 진입 | storyId, source |
| `related_place_opened` | Story/Live에서 place 이동 | originType, originId, placeId |
| `community_opened` | Discover community view 열람 | viewMode, targetId? |
| `live_session_opened` | Live detail 진입 | sessionId, status |
| `offer_opened` | Offer card expansion | offerId, offerType, availability |
| `partner_cta_clicked` | partner 이동 시도 | offerId, partner, outboundType |
| `item_saved` | 저장 성공 | targetType, targetId, collection |

### 11.2 MVP metrics

| 영역 | 지표 | 정의 | 해석 제약 |
|---|---|---|---|
| Discovery | Place Open Rate | Place detail views / Guide sessions | 지도 품질의 유일한 지표 아님 |
| Context | Story Engagement Rate | Story opens / Place detail views | Scroll만으로 이해를 단정하지 않음 |
| Intent | Save Rate | Saved items / detail views | 저장 후 실제 방문은 별도 측정 |
| Live | Live Entry Rate | Live opens / active users | replay와 live를 분리 측정 |
| Commerce | Outbound CTR | Partner CTA clicks / offer views | 구매 전환으로 오인 금지 |

---

## 12. Hypothesis and decision register

### 12.1 Product hypotheses

| ID | Hypothesis | 검증 신호 | 반증 가능성 |
|---|---|---|---|
| H-01 | 통합 위치 기반 문화 정보가 유입을 높인다 | Guide session, place open | 단순 지도보다 재방문이 낮음 |
| H-02 | Editorial context가 Place engagement를 높인다 | context consumed, save | context가 CTA 행동과 무관 |
| H-03 | Community evidence가 저장·방문 의향을 높인다 | community open 이후 save | community가 신뢰 신호가 아님 |
| H-04 | Culture-linked live가 commerce 전환을 자연스럽게 만든다 | live→offer→outbound | 별도 commerce보다 낮은 CTR |
| H-05 | MBN IP가 초기 trust/differentiation에 기여한다 | provenance interaction, survey | IP가 discovery 품질에 기여하지 않음 |

### 12.2 Open decision register

| ID | 결정 | 권고 | 미결 시 구현 규칙 |
|---|---|---|---|
| D-01 | 첫 Geography | Prototype은 서울 | city fixture만 제공, 확장 가능 schema |
| D-02 | Community level | curated/read-only | write 기능 feature flag |
| D-03 | Live provider | 미정 | UI/session contract만 고정 |
| D-04 | Commerce partner | 미정 | Offer adapter와 unavailable state |
| D-05 | Map provider | 미정 | MapAdapter + list fallback |
| D-06 | MBN branding strength | Culture-first, provenance-visible | MBN은 source label로 표현 |
| D-07 | Login/account | 미정 | local TravelerProfile 기본 |

결정 로그는 반드시 다음 형식을 사용한다.

```text
Decision ID
Date
Decision
Why
Rejected alternatives
Affected documents
Status
```

---

## 13. SSOT document system

현재 문서 단계에서는 거대한 문서 세트를 한꺼번에 만들지 않는다. 먼저 아래 8개를 제품 SSOT로 만든다.

```text
docs/
├─ 00_PRODUCT_CONSTITUTION.md
├─ 01_PRD.md
├─ 02_IA_USER_FLOW.md
├─ 03_FEATURE_SPEC.md
├─ 04_CONTENT_DATA_CONTRACT.md
├─ 05_BUSINESS_MONETIZATION_HYPOTHESIS.md
├─ 06_TECH_ARCHITECTURE_CONSTRAINTS.md
└─ 07_DECISION_LOG.md
```

구현이 시작되어 코드 사실을 기록할 필요가 생길 때만 아래 문서를 만든다.

```text
08_CODE_BASED_FSD.md
09_CURRENT_IMPLEMENTATION.md
10_DELIVERY_QA.md
```

### 13.1 문서별 책임

| 문서 | 반드시 포함할 내용 | 포함하지 않을 내용 |
|---|---|---|
| `00_PRODUCT_CONSTITUTION` | 한 문장, problem, target, value, funnel, 3 surfaces, principles | API/컴포넌트 상세 |
| `01_PRD` | JTBD, use case, MVP/non-MVP, metric, hypothesis | FSD 파일 구조 |
| `02_IA_USER_FLOW` | route, screen hierarchy, entry/exit/back, deep link | DTO/schema |
| `03_FEATURE_SPEC` | G/D/L/P/S ID, state, analytics, acceptance | provider 구현 |
| `04_CONTENT_DATA_CONTRACT` | ArticleIndex/Body, entity, relation, taxonomy, locale, provenance, geo/embedding/recommendation/release contract, fixture/API boundary | component layout |
| `05_BUSINESS_MONETIZATION_HYPOTHESIS` | partner role, disclosure, commission/lead hypothesis, legal question | 거래 완료 구현 |
| `06_TECH_ARCHITECTURE_CONSTRAINTS` | FSD, adapter, persistence, security, dependency rule, PY/notebook milestone, data zone, release consumption rule | product purpose 변경 |
| `07_DECISION_LOG` | 확정/보류/폐기 결정의 근거 | 장황한 PRD 복제 |
| `08_CODE_BASED_FSD` | 구현 후 실제 file tree와 ownership | 미래 희망 구조만 기록 |
| `09_CURRENT_IMPLEMENTATION` | 실제 구현 상태와 gap | 계획을 사실처럼 기록 |
| `10_DELIVERY_QA` | test, release, a11y, analytics evidence | 제품 정의 |

### 13.2 문서 변경 규칙

- Product constitution이 바뀌면 PRD, IA, Feature spec, Data contract 영향을 검토한다.
- IA route가 바뀌면 Feature ID, analytics entry point, architecture router contract를 함께 검토한다.
- Entity contract가 바뀌면 mock fixture, API boundary, Place/Offer UI state를 함께 갱신한다.
- 구현 후 문서는 `CURRENT_IMPLEMENTATION`에 사실만 기록하고, 목표 문서를 소급 수정해 현재 상태처럼 보이게 하지 않는다.

---

## 14. Pre-implementation gates

문서 단계의 Definition of Done은 코드 완성이 아니다. 다음 gate가 모두 PASS해야 shell migration 및 구현에 진입한다.

| Gate | PASS 조건 |
|---|---|
| P0: Product | 한 문장 정의, target, 3 Primary Surface, MBN IP 역할, live의 역할 확정 |
| P1: IA | 모든 primary/detail/utility route, entry/exit/back behavior, Guide→Detail→Discover→Live 연결 확정 |
| P2: Feature | MVP feature ID, 각 상태, analytics, acceptance criteria 존재 |
| P3: Data | core entity, relationship, taxonomy, locale/provenance, mock/live boundary 확정 |
| P4: Business safety | partner 없는 기능을 실제 거래처럼 표현하지 않음, disclosure/광고 규칙 존재 |
| P5: Source readiness | 승인된 source scope, stable sourceArticleId, ArticleIndex/Body parsing state, provenance/SHA 기록 가능 |
| P6: Geo readiness | PlaceMention/Candidate 생성, geocode provider boundary, ambiguous/not-found/error 보존, 좌표 검증 가능 |
| P7: Semantic readiness | embedding generation, model/dimension/version trace, top-k semantic relation, stale 판정 가능 |
| P8: Recommendation readiness | candidate/ranking 분리, score decomposition, human-readable reason, FK integrity 검증 |
| P9: Release readiness | immutable releaseId, manifest/SHA/schema/taxonomy/quality report, FRONT projection 생성 가능 |

### 14.1 Gate failure 처리

- P0 실패: FSD 명칭과 widget 범위를 확정하지 않는다.
- P1 실패: router, GNB, 상세 화면 구현을 시작하지 않는다.
- P2 실패: UI happy path만 먼저 만드는 작업을 시작하지 않는다.
- P3 실패: fixture를 widget JSX에 박아 넣지 않는다.
- P4 실패: Offer는 `unavailable` 또는 `coming-soon`으로만 표현한다.
- P5 실패: source collection, body corpus, release record count를 empirical 사실처럼 표현하지 않는다.
- P6 실패: geocode 불확실 candidate를 map pin 또는 nearby recommendation에 자동 승격하지 않는다.
- P7 실패: semantic relation/retrieval을 콘텐츠 유사성의 검증된 결과처럼 노출하지 않는다.
- P8 실패: 추천은 ranking list 대신 명시적 fixture/curation으로만 제공하고 "추천 이유"를 위조하지 않는다.
- P9 실패: FRONT는 production/preview에서 data bundle을 소비하지 않고 mock release를 유지한다.

---

## 15. Post-gate delivery sequence

```text
                    ┌── DATA / ML TRACK ────────────────────┐
DOCUMENT SSOT ──────┤ M0 → M5 corpus/taxonomy                │
       │            │ M6 → M10 place/geo/semantic/classify  │
       │            │ M11 → M14 recommend/release/validate  │
       │            └────────────────────────────────────────┘
       ↓
FRONT TRACK
F1 shell → F2 domain contract → F3 GUIDE → F4 PLACE/DISCOVER
       → F5 LIVE/OFFER → F6 utility → F7 QA/analytics
       ↓
Pinned, validated frontend release consumption
```

### 15.1 DOCS / FRONT track

| Front phase | 허용 산출물 | data dependency | 금지되는 선행 |
|---|---|---|---|
| F0 Document SSOT | 00~07 SSOT 문서, decision log | P0~P4 | React shell import |
| F1 Technical shell | buildable technical shell, no product fixture | 없음 | 4탭/교통 UX 복제 |
| F2 Domain contract | repository interface, schema, deterministic mock release | M0 contract version | SDK/provider 고정 |
| F3 GUIDE | map fallback, Place preview, filter UI | P6 또는 curated mock release | actual partner CTA |
| F4 PLACE + DISCOVER | detail, StoryBundle, curated community | P5 corpus projection, P6 place relation | public community write |
| F5 LIVE + OFFER | session status, offer contract, outbound attempt | P4 business safety; P9 for live data release | payment/order completion |
| F6 Utility | Saved, Profile, locale, search utility | P3 data contract | account merge 가정 |
| F7 QA + analytics | smoke, a11y, release consumption, preview evidence | P9 release manifest | metric 과장 |

### 15.2 DATA / ML track

| Data phase | Milestone | 생산물 | FRONT와의 handoff |
|---|---|---|---|
| M0 | Contract bootstrap | schema/taxonomy/version pin | F2가 참조할 contract version |
| M1–M4 | Index/title/body/normalization | ArticleIndex, ArticleBody, parse quality | Article/Story source projection 후보 |
| M5 | Culture taxonomy | taxonomy release | F2 filter labels, F3/F4 presentation |
| M6–M7 | Place extraction/geocoding | mention/candidate/geocode/canonical state | map-eligible Place projection |
| M8–M10 | Embedding/retrieval/classification | semantic relation, labels, model evidence | related story/place candidates |
| M11–M12 | Candidate/ranking | Recommendation with reason/score trace | explainable recommendation projection |
| M13–M14 | Release/validation | immutable bundle, manifest, quality report | F7 pinned release consumption |

### 15.3 Cross-track synchronization gates

| Sync gate | DATA/ML evidence | FRONT action | 실패 시 |
|---|---|---|---|
| S-01 Contract pin | M0 contract/taxonomy version | mock/repository schema pin | fixture release 유지 |
| S-02 Place projection | canonical resolved Place, quality distribution | GUIDE map/list candidate 연결 | list fallback + curated Place만 노출 |
| S-03 Content relation | article/story/place FK validation | Place detail/Discover related content 연결 | relation section empty state |
| S-04 Semantic relation | model/rank/reason trace | relevant content/recommendation UI 연결 | editorial curated relation 사용 |
| S-05 Release promotion | M13 manifest + M14 PASS | exact releaseId preview consumption | 이전 PASS release 유지 |

DATA track의 결과가 늦는다고 FRONT가 schema를 추정하거나 placeholder를 empirical data처럼 승격하지 않는다. 반대로 FRONT가 먼저 UX를 검증할 필요가 있을 때는 `contractVersion`이 명시된 deterministic fixture release를 사용한다.

---

## 16. Final product equation

```text
                         MBN GUIDEBOOK
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
        GUIDE             DISCOVER              LIVE
          │                   │                   │
       지도 탐색        Story / Community       Session / Offer
          │                   │                   │
        Place ───────── Context ───────────── Action
                              │
                    Save / Share / Partner CTA
```

MBN은 서비스의 목적 자체가 아니라 아래 차별화 자산으로 작동한다.

```text
MBN video
MBN article
MBN program and talent
MBN recommendation
MBN live
```

따라서 최종 제품 식은 다음과 같다.

> **Location discovery + culture context + community trust + live commerce + MBN content/IP**

이를 재현 가능한 데이터 제품으로 만드는 생성 식은 다음과 같다.

> **MBN raw content → article corpus → taxonomy/place/geo → semantic relation → recommendation → validated frontend release**

이 문서설계 단계에서는 이 식을 깨뜨리는 신규 탭, 확정되지 않은 거래 약속, 특정 프로그램·장르 중심의 도메인 결합을 추가하지 않는다.
