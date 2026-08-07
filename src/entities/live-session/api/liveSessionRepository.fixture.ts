import type { LiveSession } from '../model/types'
import type { LiveSessionRepository } from './liveSessionRepository'

const fixtureLiveSessions: LiveSession[] = [
  {
    id: 'fixture-culture-session',
    lifecycle: 'upcoming',
    category: 'culture-travel',
    localized: {
      ko: {
        title: '데모 문화 세션',
        deck: 'UPCOMING · fixture only',
        summary: '라이브 상태와 관련 장소 연결을 검증하는 예정 세션 fixture입니다.',
      },
      en: {
        title: 'Demo Culture Session',
        deck: 'UPCOMING · fixture only',
        summary: 'An upcoming fixture session for validating status and related-place presentation.',
      },
    },
    hostName: 'Demo host',
    player: { status: 'unavailable', reason: 'PROVIDER_NOT_CONNECTED' },
    chat: { status: 'unavailable', reason: 'POLICY_NOT_READY' },
    offer: { status: 'unavailable', reason: 'NO_ELIGIBLE_OFFER' },
    placeIds: ['fixture-riverside-stage'],
    articleIds: ['fixture-riverside-article'],
    offerIds: ['fixture-riverside-offer'],
    provenance: {
      source: 'editor',
      referenceId: 'fixture:live:culture-session',
      label: { ko: '데모 fixture · 실제 송출 아님', en: 'Demo fixture · not an actual broadcast' },
      method: 'fixture',
    },
  },
  {
    id: 'fixture-live-player-unavailable',
    lifecycle: 'live',
    category: 'music',
    localized: {
      ko: {
        title: '데모 라이브 세션',
        deck: 'LIVE · fixture only',
        summary: '라이브 lifecycle과 별도 player unavailable 상태를 검증합니다.',
      },
      en: {
        title: 'Demo Live Session',
        deck: 'LIVE · fixture only',
        summary: 'It validates a live lifecycle separate from player unavailability.',
      },
    },
    hostName: 'Demo host',
    player: { status: 'unavailable', reason: 'PROVIDER_NOT_CONNECTED' },
    chat: { status: 'unavailable', reason: 'POLICY_NOT_READY' },
    offer: { status: 'unavailable', reason: 'NO_ELIGIBLE_OFFER' },
    placeIds: [],
    articleIds: [],
    offerIds: [],
    provenance: {
      source: 'editor',
      referenceId: 'fixture:live:unavailable-session',
      label: { ko: '데모 fixture · 실제 송출 아님', en: 'Demo fixture · not an actual broadcast' },
      method: 'fixture',
    },
  },
  {
    id: 'fixture-replay-session',
    lifecycle: 'replay',
    category: 'culture-travel',
    localized: {
      ko: { title: '데모 리플레이 세션', deck: 'REPLAY · fixture only', summary: '재생 소스가 명시적으로 없을 때의 REPLAY lifecycle fixture입니다.' },
      en: { title: 'Demo Replay Session', deck: 'REPLAY · fixture only', summary: 'A replay lifecycle fixture with no connected playback source.' },
    },
    hostName: 'Demo host',
    player: { status: 'unavailable', reason: 'NO_REPLAY_SOURCE' },
    chat: { status: 'unavailable', reason: 'POLICY_NOT_READY' },
    offer: { status: 'unavailable', reason: 'NO_ELIGIBLE_OFFER' },
    placeIds: ['fixture-studio-exhibit'],
    articleIds: [],
    offerIds: [],
    provenance: { source: 'editor', referenceId: 'fixture:live:replay-session', label: { ko: '데모 fixture · 실제 송출 아님', en: 'Demo fixture · not an actual broadcast' }, method: 'fixture' },
  },
  {
    id: 'fixture-ended-session',
    lifecycle: 'ended',
    category: 'music',
    localized: {
      ko: { title: '데모 종료 세션', deck: 'ENDED · fixture only', summary: '종료된 세션도 문맥을 보존하되 commerce card가 되지 않음을 검증합니다.' },
      en: { title: 'Demo Ended Session', deck: 'ENDED · fixture only', summary: 'It retains context after ending without becoming a commerce card.' },
    },
    hostName: 'Demo host',
    player: { status: 'unavailable', reason: 'NO_REPLAY_SOURCE' },
    chat: { status: 'unavailable', reason: 'POLICY_NOT_READY' },
    offer: { status: 'unavailable', reason: 'NO_ELIGIBLE_OFFER' },
    placeIds: ['fixture-riverside-stage'],
    articleIds: [],
    offerIds: [],
    provenance: { source: 'editor', referenceId: 'fixture:live:ended-session', label: { ko: '데모 fixture · 실제 송출 아님', en: 'Demo fixture · not an actual broadcast' }, method: 'fixture' },
  },
]

export const fixtureLiveSessionRepository: LiveSessionRepository = {
  async list() {
    return fixtureLiveSessions
  },
  async getById(id) {
    return fixtureLiveSessions.find((session) => session.id === id) ?? null
  },
}
