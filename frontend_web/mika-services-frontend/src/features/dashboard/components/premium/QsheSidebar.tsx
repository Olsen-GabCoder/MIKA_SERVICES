import { useTranslation } from 'react-i18next'
import type { SecuriteStats } from '@/types/reporting'
import type { QsheCounts } from '../../hooks/useQsheCounts'

export interface QsheSidebarProps {
  securite: SecuriteStats
  counts: QsheCounts
}

const items = (s: SecuriteStats, c: QsheCounts) => [
  { label: 'Incidents graves', value: s.incidentsGraves, variant: 'danger' as const, icon: <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /> },
  { label: 'Risques critiques', value: s.risquesCritiques, variant: 'danger' as const, icon: <><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></> },
  { label: 'Actions en retard', value: c.actions.enRetard, variant: 'warn' as const, icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></> },
  { label: 'Certificats expirants', value: c.certifications.expirant + c.certifications.expirees, variant: 'warn' as const, icon: <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /> },
  { label: 'EPI expirés', value: c.epi.expires, variant: 'neutral' as const, icon: <path d="M12 2l9 4v6c0 5-3.5 9.7-9 10-5.5-.3-9-5-9-10V6l9-4z" /> },
]

export function QsheSidebar({ securite, counts }: QsheSidebarProps) {
  const { t } = useTranslation('common')
  const list = items(securite, counts)
  const colorMap = { danger: 'var(--db-danger)', warn: 'var(--db-warn)', neutral: 'var(--db-t1)' }

  return (
    <div className="col-span-12 lg:col-span-4 rounded-xl p-4" style={{ background: 'var(--db-card)', animation: 'db-rise 380ms ease-out 210ms both' }}>
      <div className="flex items-center gap-2.5 mb-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: 'var(--db-t3)' }}>{t('db.premium.securiteQshe')}</span>
        <span className="ml-auto text-[11.5px] cursor-pointer hover:text-[var(--db-t1)] transition-colors" style={{ color: 'var(--db-t3)' }}>{t('db.premium.detail')} →</span>
      </div>
      <div className="flex flex-col">
        {list.map((item, i) => (
          <div key={i} className="flex items-center justify-between py-2.5 border-b last:border-b-0" style={{ borderColor: 'var(--db-border)' }}>
            <span className="flex items-center gap-2.5 text-[12.5px]" style={{ color: 'var(--db-t2)' }}>
              <span className="w-[22px] h-[22px] rounded-md grid place-items-center" style={{ background: 'var(--db-subtle)', color: 'var(--db-t3)' }}>
                <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>{item.icon}</svg>
              </span>
              {item.label}
            </span>
            <span className="text-[18px] font-semibold db-tight db-num" style={{ color: colorMap[item.variant] }}>{item.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-dashed flex justify-between text-[11px] db-num" style={{ borderColor: 'var(--db-border)', color: 'var(--db-t3)' }}>
        <span>Score sécurité <strong className="font-semibold" style={{ color: 'var(--db-t1)' }}>92/100</strong></span>
        <span style={{ color: 'var(--db-success)' }}>↑ +3 pts</span>
      </div>
    </div>
  )
}
