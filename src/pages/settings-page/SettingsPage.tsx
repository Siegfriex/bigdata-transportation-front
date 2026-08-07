import { useState } from 'react'
import type { PlaceCategory } from '../../entities/place'
import { PLACE_CATEGORIES } from '../../entities/place'
import type { TravelerProfile, VisitorMode } from '../../entities/traveler-profile'
import { getTravelerProfile, setTravelerProfile } from '../../features/manage-traveler-profile'
import { track } from '../../shared/analytics'
import { useI18n } from '../../shared/i18n'
import { Chip, StatusNotice, useToast } from '../../shared/ui'
import { UtilityNavigation } from '../../widgets/app-chrome'

export function SettingsPage() {
  const { locale, setLocale, t } = useI18n(); const [profile, setProfile] = useState<TravelerProfile>(() => getTravelerProfile()); const { pushToast } = useToast()
  const updateProfile = (next: TravelerProfile) => { const persistenceStatus: TravelerProfile['persistenceStatus'] = setTravelerProfile(next) ? 'local' : 'unavailable'; const persisted = { ...next, persistenceStatus }; setProfile(persisted); track('profile_preferences_persisted', { locale: persisted.locale, visitorMode: persisted.visitorMode, interestCount: persisted.interests.length, persistenceStatus }); pushToast({ message: persistenceStatus === 'local' ? t('settings.saved') : t('settings.storageError') }) }
  const updateLocale = (nextLocale: string) => { const next = nextLocale === 'en' ? 'en' : 'ko'; setLocale(next); updateProfile({ ...profile, locale: next }) }
  const toggleInterest = (interest: PlaceCategory) => updateProfile({ ...profile, interests: profile.interests.includes(interest) ? profile.interests.filter((item) => item !== interest) : [...profile.interests, interest] })
  return <main id="main-content" className="product-page settings-page"><UtilityNavigation />
    <header className="settings-page__header"><h1>{t('settings.title')}</h1><p>{t('settings.description')}</p></header>
    <section className="settings-profile" aria-label={t('settings.title')}>
      <div className="settings-profile__avatar" aria-hidden="true">MG</div>
      <div><p>{locale === 'ko' ? '여행자 프로필' : 'Traveler profile'}</p><strong>{locale === 'ko' ? '나의 문화 탐색 설정' : 'Your culture discovery preferences'}</strong><span>{locale === 'ko' ? '사진과 계정 기능은 준비 중입니다' : 'Photo and account controls are coming later'}</span></div>
    </section>
    <section className="settings-group">
      <h2 id="settings-language-title">{locale === 'ko' ? '언어 및 화면' : 'Language & display'}</h2>
      <label className="settings-row settings-row--select"><span><strong>{t('settings.language')}</strong><small>{locale === 'ko' ? '콘텐츠가 제공되는 언어를 선택합니다' : 'Choose the language used for available content'}</small></span><select value={locale} onChange={(event) => updateLocale(event.target.value)}><option value="ko">한국어</option><option value="en">English</option></select></label>
      <div className="settings-row settings-row--disabled"><span><strong>{locale === 'ko' ? '글자 크기' : 'Text size'}</strong><small>{locale === 'ko' ? '기기 설정을 따릅니다' : 'Follows your device setting'}</small></span><em>{locale === 'ko' ? '준비 중' : 'Coming later'}</em></div>
    </section>
    <fieldset className="settings-group settings-choice-group"><legend>{t('settings.visitorMode')}</legend><p>{locale === 'ko' ? '여행 목적에 맞는 탐색 맥락을 저장합니다' : 'Save a discovery context that matches your visit'}</p>{(['foreigner', 'domestic-traveler', 'local-explorer'] as VisitorMode[]).map((mode) => <label key={mode}><input type="radio" name="visitor-mode" checked={profile.visitorMode === mode} onChange={() => updateProfile({ ...profile, visitorMode: mode })} /><span>{t(`label.visitor.${mode}`)}</span></label>)}</fieldset>
    <fieldset className="settings-group settings-interest-group"><legend>{t('settings.interests')}</legend><p>{locale === 'ko' ? '선택은 이 기기에만 저장됩니다' : 'Choices are stored on this device only'}</p><div className="filter-row">{PLACE_CATEGORIES.map((interest) => <Chip key={interest} selected={profile.interests.includes(interest)} onClick={() => toggleInterest(interest)}>{t(`label.category.${interest}`)}</Chip>)}</div></fieldset>
    <div className="settings-page__status"><StatusNotice state={profile.persistenceStatus === 'local' ? 'SUCCESS' : 'UNAVAILABLE'} title={profile.persistenceStatus === 'local' ? t('settings.persisted') : t('settings.storageUnavailable')}>{t('settings.profileDescription')}</StatusNotice></div>
  </main>
}
