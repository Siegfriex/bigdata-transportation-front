import type { Place } from '../model/types'
import type { PlaceListParams, PlaceRepository } from './placeRepository'

const fixturePlaces: Place[] = [
  {
    id: 'fixture-riverside-stage',
    slug: 'fixture-riverside-stage',
    coordinates: { lat: 37.527, lng: 126.934 },
    address: {
      ko: '데모 지역 · 좌표는 UI 검증용입니다',
      en: 'Demo area · coordinates are for UI verification only',
    },
    category: 'performance',
    tags: ['demo', 'performance', 'evening'],
    localized: {
      ko: {
        name: '데모 리버사이드 스테이지',
        summary: '문화 발견 화면을 검증하기 위한 비실증 공연 fixture입니다.',
        whyItMatters: '위치, 문화 맥락, 출처를 한 카드에서 읽는 UI 흐름을 검증합니다.',
        availableExperience: '공연 정보 구조와 상세 진입 동작을 확인할 수 있습니다.',
      },
      en: {
        name: 'Demo Riverside Stage',
        summary: 'A non-empirical performance fixture for validating the discovery interface.',
        whyItMatters: 'It validates a single card flow for location, cultural context, and provenance.',
        availableExperience: 'Use it to verify performance information structure and detail navigation.',
      },
    },
    localeSupport: ['ko', 'en'],
    source: 'editor',
    provenance: {
      source: 'editor',
      referenceId: 'fixture:place:riverside-stage',
      label: { ko: '데모 fixture · 실증 데이터 아님', en: 'Demo fixture · not empirical data' },
      method: 'fixture',
      isSponsored: false,
    },
    relatedStoryIds: ['fixture-riverside-story'],
    relatedLiveIds: ['fixture-culture-session'],
    offerIds: ['fixture-riverside-offer'],
    status: 'active',
  },
  {
    id: 'fixture-studio-exhibit',
    slug: 'fixture-studio-exhibit',
    coordinates: { lat: 37.557, lng: 126.923 },
    address: {
      ko: '데모 지역 · 실제 방문 정보가 아닙니다',
      en: 'Demo area · not real visit information',
    },
    category: 'exhibition',
    tags: ['demo', 'exhibition', 'editorial'],
    localized: {
      ko: {
        name: '데모 스튜디오 전시',
        summary: '빈 상태와 출처 표기를 검증하기 위한 전시 fixture입니다.',
        whyItMatters: '콘텐츠 연결이 아직 없을 때도 장소의 정체성과 데이터 한계를 투명하게 보여줍니다.',
        availableExperience: '전시 카테고리 필터와 상세 화면의 섹션 순서를 확인할 수 있습니다.',
      },
      en: {
        name: 'Demo Studio Exhibit',
        summary: 'An exhibition fixture for testing empty states and provenance display.',
        whyItMatters: 'It transparently shows identity and data limits even when related content is absent.',
        availableExperience: 'Use it to validate exhibition filtering and the detail-section order.',
      },
    },
    localeSupport: ['ko', 'en'],
    source: 'editor',
    provenance: {
      source: 'editor',
      referenceId: 'fixture:place:studio-exhibit',
      label: { ko: '데모 fixture · 실증 데이터 아님', en: 'Demo fixture · not empirical data' },
      method: 'fixture',
      isSponsored: false,
    },
    relatedStoryIds: [],
    relatedLiveIds: [],
    offerIds: [],
    status: 'active',
  },
  {
    id: 'fixture-night-market',
    slug: 'fixture-night-market',
    coordinates: { lat: 37.567, lng: 126.978 },
    address: {
      ko: '데모 지역 · 운영 여부 미검증',
      en: 'Demo area · availability unverified',
    },
    category: 'food',
    tags: ['demo', 'food', 'unavailable'],
    localized: {
      ko: {
        name: '데모 나이트 마켓',
        summary: '사용 불가 상태의 표현을 검증하는 푸드 fixture입니다.',
        whyItMatters: '알 수 없는 운영 정보를 성공 상태처럼 노출하지 않는 UX 원칙을 확인합니다.',
        availableExperience: '현재 이용 가능 여부가 검증되지 않았습니다.',
      },
      en: {
        name: 'Demo Night Market',
        summary: 'A food fixture for verifying unavailable-state presentation.',
        whyItMatters: 'It confirms that unknown availability is never presented as success.',
        availableExperience: 'Current availability has not been verified.',
      },
    },
    localeSupport: ['ko', 'en'],
    source: 'editor',
    provenance: {
      source: 'editor',
      referenceId: 'fixture:place:night-market',
      label: { ko: '데모 fixture · 실증 데이터 아님', en: 'Demo fixture · not empirical data' },
      method: 'fixture',
      isSponsored: false,
    },
    relatedStoryIds: [],
    relatedLiveIds: [],
    offerIds: [],
    status: 'unavailable',
  },
]

export const fixturePlaceRepository: PlaceRepository = {
  async list(params: PlaceListParams = {}) {
    const category = params.category ?? 'all'
    return category === 'all' ? fixturePlaces : fixturePlaces.filter((place) => place.category === category)
  },
  async getById(id: string) {
    return fixturePlaces.find((place) => place.id === id) ?? null
  },
}
