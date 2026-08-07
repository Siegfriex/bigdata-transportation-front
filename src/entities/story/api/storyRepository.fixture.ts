import type { Story } from '../model/types'
import type { StoryRepository } from './storyRepository'

const fixtureStories: Story[] = [
  {
    id: 'fixture-riverside-story',
    localized: {
      ko: {
        headline: '문화 맥락은 장소 카드 이후에도 이어져야 한다',
        deck: '데모 Story projection',
        summary: '장소와 편집 맥락의 연결 UI를 검증하기 위한 비실증 Story fixture입니다.',
      },
      en: {
        headline: 'Cultural context should continue beyond the place card',
        deck: 'Demo Story projection',
        summary: 'A non-empirical Story fixture for validating the connection between place and editorial context.',
      },
    },
    articleIds: ['fixture-riverside-article'],
    placeIds: ['fixture-riverside-stage'],
    liveIds: ['fixture-culture-session'],
    tags: ['demo', 'performance', 'context'],
    provenance: {
      source: 'editor',
      referenceId: 'fixture:story:riverside',
      label: { ko: '데모 fixture · 실증 콘텐츠 아님', en: 'Demo fixture · not empirical content' },
      method: 'fixture',
    },
    status: 'active',
  },
]

export const fixtureStoryRepository: StoryRepository = {
  async list() {
    return fixtureStories
  },
  async getById(id) {
    return fixtureStories.find((story) => story.id === id) ?? null
  },
}
