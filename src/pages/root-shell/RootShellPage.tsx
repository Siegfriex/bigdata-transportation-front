import { useState } from 'react'
import { AppShell } from '../../app/layouts/AppShell'
import { useI18n } from '../../shared/i18n'
import { BottomSheet, Button, Card, StatusNotice, useToast } from '../../shared/ui'

export function RootShellPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const { locale, setLocale, t } = useI18n()
  const { pushToast } = useToast()

  return (
    <AppShell>
      <section className="foundation-page" aria-labelledby="foundation-title">
        <p className="eyebrow">M-1</p>
        <h1 id="foundation-title">{t('foundation.title')}</h1>
        <p className="foundation-page__description">{t('foundation.description')}</p>

        <Card className="foundation-page__card">
          <StatusNotice state="IDLE" title={t('foundation.status.title')}>
            {t('foundation.status.description')}
          </StatusNotice>
          <div className="foundation-page__actions">
            <Button onClick={() => setIsSheetOpen(true)}>{t('foundation.openOverlay')}</Button>
            <Button
              variant="secondary"
              onClick={() => pushToast({ message: t('foundation.toast') })}
            >
              {t('foundation.showToast')}
            </Button>
          </div>
          <label className="locale-control">
            <span>{t('foundation.locale')}</span>
            <select value={locale} onChange={(event) => setLocale(event.target.value)}>
              <option value="ko">한국어</option>
              <option value="en">English</option>
            </select>
          </label>
        </Card>
      </section>

      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={t('foundation.overlay.title')}
        closeLabel={t('foundation.overlay.close')}
      >
        <p>{t('foundation.overlay.description')}</p>
        <Button onClick={() => setIsSheetOpen(false)}>{t('foundation.overlay.close')}</Button>
      </BottomSheet>
    </AppShell>
  )
}
